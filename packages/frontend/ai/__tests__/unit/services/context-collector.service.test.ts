/**
 * @file context-collector.service.test.ts
 * @description Unit tests for {@link ContextCollector} — debounce (Req 12.2),
 *   ordered focus-stack serialization (Req 11.4), PII redaction (Req 12.4),
 *   diff-suppression (Req 12.3), leader gating (Req 13), and size caps
 *   (Req 12.7/12.8).
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { IAiClient, IAiConfig, IPiiRule, IUiContextSnapshot } from "@stackra/contracts";

import { ContextRegistry } from "@/core/registries/context.registry";
import { PiiRedactor } from "@/core/services/pii-redactor.service";
import { ContextCollector } from "@/core/services/context-collector.service";

// ── Fixtures ─────────────────────────────────────────────────────────────

function makeClient(): { client: IAiClient; synced: IUiContextSnapshot[] } {
  const synced: IUiContextSnapshot[] = [];
  const client = {
    syncContext: vi.fn((s: IUiContextSnapshot) => {
      synced.push(s);
      return Promise.resolve();
    }),
  } as unknown as IAiClient;
  return { client, synced };
}

interface IHarness {
  registry: ContextRegistry;
  collector: ContextCollector;
  client: IAiClient;
  synced: IUiContextSnapshot[];
}

function makeHarness(
  overrides: {
    piiRules?: IPiiRule[];
    maxFrameBytes?: number;
    maxSnapshotBytes?: number;
    leaderGated?: boolean;
  } = {},
): IHarness {
  const config: IAiConfig = {
    baseUrl: "https://x",
    authProvider: {
      getCredentials: () => Promise.resolve({}),
      refresh: () => Promise.resolve({}),
    },
    context: {
      debounceMs: 500,
      leaderGated: overrides.leaderGated ?? true,
      piiRules: overrides.piiRules,
      maxFrameBytes: overrides.maxFrameBytes,
      maxSnapshotBytes: overrides.maxSnapshotBytes,
    },
  };
  const registry = new ContextRegistry();
  const redactor = new PiiRedactor(config);
  const { client, synced } = makeClient();
  const collector = new ContextCollector(registry, redactor, client, config);
  collector.onModuleInit();
  return { registry, collector, client, synced };
}

// ── Tests ────────────────────────────────────────────────────────────────

describe("ContextCollector debounce + serialization (Req 12.2, 11.4)", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("debounces multiple registrations to at most one sync per window", async () => {
    const { registry, collector, synced } = makeHarness();
    registry.register({ key: "a", snapshot: 1 });
    registry.register({ key: "b", snapshot: 2 });
    registry.register({ key: "c", snapshot: 3 });
    expect(synced).toHaveLength(0);

    await vi.advanceTimersByTimeAsync(500);
    await collector.flush(); // ensure any pending microtasks settle
    expect(synced).toHaveLength(1);
    expect(synced[0]!.focusStack.map((f) => f.key)).toEqual(["c", "b", "a"]);
  });

  it("preserves the focus-stack order (topmost first) in the emitted snapshot", async () => {
    const { registry, collector, synced } = makeHarness();
    registry.register({ key: "page", snapshot: null, priority: 0 });
    registry.register({ key: "drawer", snapshot: null, priority: 1 });
    registry.register({ key: "popup", snapshot: null, priority: 2 });
    await collector.flush();
    expect(synced[0]!.focusStack.map((f) => f.key)).toEqual(["popup", "drawer", "page"]);
  });
});

describe("ContextCollector diff-suppression (Req 12.3)", () => {
  it("suppresses re-emission when the snapshot is unchanged", async () => {
    const { registry, collector, synced } = makeHarness();
    registry.register({ key: "a", snapshot: { v: 1 } });
    await collector.flush();
    await collector.flush();
    expect(synced).toHaveLength(1);
  });

  it("re-emits when the snapshot content actually changes", async () => {
    const { registry, collector, synced } = makeHarness();
    registry.register({ key: "a", snapshot: { v: 1 } });
    await collector.flush();
    registry.update("a", { v: 2 });
    await collector.flush();
    expect(synced).toHaveLength(2);
  });
});

describe("ContextCollector PII redaction (Req 12.4)", () => {
  it("runs every frame through the redactor before including it", async () => {
    const { registry, collector, synced } = makeHarness({
      piiRules: [{ field: "email" }],
    });
    registry.register({ key: "user", snapshot: { email: "ada@example.com", name: "Ada" } });
    await collector.flush();
    expect(synced[0]!.focusStack[0]!.snapshot).toEqual({ email: "[REDACTED]", name: "Ada" });
  });
});

describe("ContextCollector leader gate (Req 13)", () => {
  it("suppresses syncs while not leader", async () => {
    const { registry, collector, synced } = makeHarness();
    collector.setLeader(false);
    registry.register({ key: "a", snapshot: 1 });
    await collector.flush();
    expect(synced).toHaveLength(0);
  });

  it("resumes syncs on the newly-elected leader (Req 13.4)", async () => {
    const { registry, collector, synced } = makeHarness();
    collector.setLeader(false);
    registry.register({ key: "a", snapshot: 1 });
    await collector.flush();
    expect(synced).toHaveLength(0);

    collector.setLeader(true);
    // setLeader schedules a flush; force it.
    await collector.flush();
    expect(synced).toHaveLength(1);
  });

  it("ignores leader state when leaderGated is disabled", async () => {
    const { registry, collector, synced } = makeHarness({ leaderGated: false });
    collector.setLeader(false); // should be a no-op
    registry.register({ key: "a", snapshot: 1 });
    await collector.flush();
    expect(synced).toHaveLength(1);
  });
});

describe("ContextCollector size caps (Req 12.7, 12.8)", () => {
  it("truncates oversized frames", async () => {
    const { registry, collector, synced } = makeHarness({ maxFrameBytes: 32 });
    registry.register({ key: "big", snapshot: { field: "x".repeat(1000) } });
    await collector.flush();
    const emitted = synced[0]!.focusStack[0]!.snapshot as { _truncated?: boolean };
    expect(emitted._truncated).toBe(true);
  });

  it("omits frames that exceed the aggregate cap", async () => {
    const { registry, collector, synced } = makeHarness({
      maxFrameBytes: 100_000,
      maxSnapshotBytes: 100,
    });
    registry.register({ key: "a", snapshot: { field: "x".repeat(60) } });
    registry.register({ key: "b", snapshot: { field: "x".repeat(60) } });
    await collector.flush();
    // Only the higher-priority one (later-mounted at same priority) fits.
    expect(synced[0]!.focusStack).toHaveLength(1);
  });
});

describe("ContextCollector — sync failure recovery", () => {
  it("does not update lastSynced when the sync fails (allows retry)", async () => {
    const registry = new ContextRegistry();
    const config: IAiConfig = {
      baseUrl: "https://x",
      authProvider: {
        getCredentials: () => Promise.resolve({}),
        refresh: () => Promise.resolve({}),
      },
      context: { debounceMs: 500, leaderGated: false },
    };
    const redactor = new PiiRedactor(config);
    const calls: IUiContextSnapshot[] = [];
    let firstAttempt = true;
    const client = {
      syncContext: vi.fn((s: IUiContextSnapshot) => {
        calls.push(s);
        if (firstAttempt) {
          firstAttempt = false;
          return Promise.reject(new Error("network flake"));
        }
        return Promise.resolve();
      }),
    } as unknown as IAiClient;
    const collector = new ContextCollector(registry, redactor, client, config);
    collector.onModuleInit();

    registry.register({ key: "a", snapshot: 1 });
    await collector.flush();
    await collector.flush();

    // Two attempts because the first failed and reset lastSynced.
    expect(calls).toHaveLength(2);
  });
});
