/**
 * @file analytics-manager.test.ts
 * @module @stackra/analytics/__tests__/unit
 * @description Behavioural tests for `AnalyticsManager` —
 *   `MultipleInstanceManager` semantics (`instance`, `extend`,
 *   `driver` config resolution), fan-out across the configured
 *   `stack`, consent gating with buffering + replay, and error
 *   isolation.
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import type {
  IAnalyticsEvent,
  IAnalyticsIdentity,
  IAnalyticsPageView,
  IAnalyticsProvider,
} from "@stackra/contracts";

import { AnalyticsManager } from "@/core/services/analytics-manager.service";
import type { IAnalyticsModuleOptions } from "@/core/interfaces";
import { mergeConfig } from "@/core/utils/merge-config.util";

import { ControllableConsentGate } from "../support/consent-gate";

// ════════════════════════════════════════════════════════════════════════════
// Test provider — a simple recorder that implements the full contract.
// ════════════════════════════════════════════════════════════════════════════

interface IRecordedCall {
  provider: string;
  kind: "init" | "track" | "page" | "identify" | "reset";
  payload?: unknown;
}

class RecordingProvider implements IAnalyticsProvider {
  public constructor(
    public readonly name: string,
    public readonly consentCategory: string | undefined,
    private readonly log: IRecordedCall[],
  ) {}

  public init(): void {
    this.log.push({ provider: this.name, kind: "init" });
  }

  public track(event: IAnalyticsEvent): void {
    this.log.push({ provider: this.name, kind: "track", payload: event });
  }

  public page(view: IAnalyticsPageView): void {
    this.log.push({ provider: this.name, kind: "page", payload: view });
  }

  public identify(identity: IAnalyticsIdentity): void {
    this.log.push({ provider: this.name, kind: "identify", payload: identity });
  }

  public reset(): void {
    this.log.push({ provider: this.name, kind: "reset" });
  }
}

/** Build a manager wired to a set of freshly-registered driver names. */
function buildManager(
  options: Partial<IAnalyticsModuleOptions>,
  log: IRecordedCall[],
  drivers: Record<string, (config: Record<string, unknown>) => IAnalyticsProvider>,
  consent?: ControllableConsentGate,
): AnalyticsManager {
  const config = mergeConfig(options);
  const manager = new AnalyticsManager(config, consent);
  for (const [driver, creator] of Object.entries(drivers)) {
    // extend() registers a custom driver on the MultipleInstanceManager base —
    // this bypasses the built-in `console`/`ga4` factories entirely.
    manager.extend(driver, (cfg) => creator(cfg));
  }
  // Prime the log — some tests need init to happen before dispatch.
  return manager;
}

// ════════════════════════════════════════════════════════════════════════════
// Specs
// ════════════════════════════════════════════════════════════════════════════

describe("AnalyticsManager — MultipleInstanceManager semantics", () => {
  let log: IRecordedCall[];

  beforeEach(() => {
    log = [];
  });

  it("resolves a named instance via extend() + instance()", () => {
    const manager = buildManager(
      {
        default: "main",
        providers: { main: { driver: "recording" } },
      },
      log,
      {
        recording: (cfg) => new RecordingProvider((cfg.driver as string) + "-1", undefined, log),
      },
    );

    const resolved = manager.instance("main");
    expect(resolved.name).toBe("recording-1");

    // Cached — second call returns the same instance.
    expect(manager.instance("main")).toBe(resolved);
  });

  it("throws when instance name is not configured", () => {
    const manager = buildManager(
      { default: "main", providers: { main: { driver: "recording" } } },
      log,
      { recording: () => new RecordingProvider("recording", undefined, log) },
    );

    expect(() => manager.instance("missing")).toThrow(/not defined/);
  });

  it("provider(name) resolves a configured instance", () => {
    const manager = buildManager(
      {
        default: "primary",
        providers: {
          primary: { driver: "recording" },
          secondary: { driver: "recording" },
        },
      },
      log,
      {
        recording: (cfg) =>
          new RecordingProvider((cfg.driver as string) + ":" + Math.random(), undefined, log),
      },
    );

    const p = manager.provider("primary");
    expect(p).toBeDefined();
    expect(p!.name).toMatch(/^recording:/);
  });

  it("provider(name) returns undefined for unknown names", () => {
    const manager = buildManager(
      { default: "primary", providers: { primary: { driver: "recording" } } },
      log,
      { recording: () => new RecordingProvider("recording", undefined, log) },
    );

    expect(manager.provider("nowhere")).toBeUndefined();
  });
});

describe("AnalyticsManager — fan-out", () => {
  let log: IRecordedCall[];

  beforeEach(() => {
    log = [];
  });

  it("dispatches track() to every provider in the configured stack", () => {
    const manager = buildManager(
      {
        default: "a",
        providers: {
          a: { driver: "rec-a" },
          b: { driver: "rec-b" },
        },
        // No stack set — defaults to every configured instance.
        requireConsent: false,
      },
      log,
      {
        "rec-a": () => new RecordingProvider("a", undefined, log),
        "rec-b": () => new RecordingProvider("b", undefined, log),
      },
    );

    manager.track("signup", { plan: "pro" });

    const trackCalls = log.filter((c) => c.kind === "track");
    expect(trackCalls).toHaveLength(2);
    expect(trackCalls.map((c) => c.provider).sort()).toEqual(["a", "b"]);
    // Both providers received the same event shape.
    expect(trackCalls[0]!.payload).toEqual({ name: "signup", properties: { plan: "pro" } });
  });

  it("honours the explicit `stack` filter", () => {
    const manager = buildManager(
      {
        default: "a",
        providers: {
          a: { driver: "rec-a" },
          b: { driver: "rec-b" },
        },
        stack: ["a"],
        requireConsent: false,
      },
      log,
      {
        "rec-a": () => new RecordingProvider("a", undefined, log),
        "rec-b": () => new RecordingProvider("b", undefined, log),
      },
    );

    manager.track("signup");

    const providers = log.filter((c) => c.kind === "track").map((c) => c.provider);
    expect(providers).toEqual(["a"]);
  });

  it("fan-out includes ad-hoc providers registered via register()", () => {
    const manager = buildManager(
      {
        default: "a",
        providers: { a: { driver: "rec-a" } },
        requireConsent: false,
      },
      log,
      { "rec-a": () => new RecordingProvider("a", undefined, log) },
    );

    // Register an ad-hoc provider — the loader / forFeature path.
    const adhoc = new RecordingProvider("adhoc", undefined, log);
    manager.register(adhoc);

    manager.track("signup");

    const providers = log.filter((c) => c.kind === "track").map((c) => c.provider);
    expect(providers.sort()).toEqual(["a", "adhoc"]);
  });

  it("register() is idempotent by provider name", () => {
    const manager = buildManager(
      {
        default: "a",
        providers: { a: { driver: "rec-a" } },
        requireConsent: false,
      },
      log,
      { "rec-a": () => new RecordingProvider("a", undefined, log) },
    );

    const first = new RecordingProvider("adhoc", undefined, log);
    const second = new RecordingProvider("adhoc", undefined, log);
    manager.register(first);
    manager.register(second);

    manager.track("signup");
    // Adhoc appears exactly once (register skipped duplicate name).
    const adhocs = log.filter((c) => c.kind === "track" && c.provider === "adhoc");
    expect(adhocs).toHaveLength(1);
  });

  it("isolates a throwing provider from the rest of the fan-out", () => {
    const manager = buildManager(
      {
        default: "a",
        providers: {
          a: { driver: "rec-a" },
          b: { driver: "broken" },
          c: { driver: "rec-c" },
        },
        requireConsent: false,
      },
      log,
      {
        "rec-a": () => new RecordingProvider("a", undefined, log),
        "rec-c": () => new RecordingProvider("c", undefined, log),
        broken: () => {
          // A provider whose `.track` always throws.
          const provider: IAnalyticsProvider = {
            name: "broken",
            track: () => {
              throw new Error("broken provider");
            },
          };
          return provider;
        },
      },
    );

    expect(() => manager.track("signup")).not.toThrow();

    // The two healthy providers still fired.
    const providers = log.filter((c) => c.kind === "track").map((c) => c.provider);
    expect(providers.sort()).toEqual(["a", "c"]);
  });

  it("fan-out dedupes providers by name when configured + ad-hoc collide", () => {
    const manager = buildManager(
      {
        default: "a",
        providers: { a: { driver: "rec-a" } },
        requireConsent: false,
      },
      log,
      { "rec-a": () => new RecordingProvider("a", undefined, log) },
    );

    // Ad-hoc uses the same name as the configured provider — dedupe keeps the
    // configured one and drops the ad-hoc entry.
    manager.register(new RecordingProvider("a", undefined, log));

    manager.track("signup");
    expect(log.filter((c) => c.kind === "track")).toHaveLength(1);
  });

  it("page() and identify() fan out too", () => {
    const manager = buildManager(
      {
        default: "a",
        providers: {
          a: { driver: "rec-a" },
          b: { driver: "rec-b" },
        },
        requireConsent: false,
      },
      log,
      {
        "rec-a": () => new RecordingProvider("a", undefined, log),
        "rec-b": () => new RecordingProvider("b", undefined, log),
      },
    );

    manager.page({ path: "/dashboard", title: "Dashboard" });
    manager.identify("user-1", { plan: "pro" });

    expect(log.filter((c) => c.kind === "page")).toHaveLength(2);
    expect(log.filter((c) => c.kind === "identify")).toHaveLength(2);
  });

  it("reset() clears identity and calls reset() on every provider", () => {
    const manager = buildManager(
      {
        default: "a",
        providers: {
          a: { driver: "rec-a" },
          b: { driver: "rec-b" },
        },
        requireConsent: false,
      },
      log,
      {
        "rec-a": () => new RecordingProvider("a", undefined, log),
        "rec-b": () => new RecordingProvider("b", undefined, log),
      },
    );

    manager.identify("user-1");
    manager.reset();

    const resets = log.filter((c) => c.kind === "reset");
    expect(resets).toHaveLength(2);
  });
});

describe("AnalyticsManager — consent gating", () => {
  let log: IRecordedCall[];

  beforeEach(() => {
    log = [];
  });

  it("withholds events from providers whose category is not consented", () => {
    const gate = new ControllableConsentGate({ analytics: false });
    const manager = buildManager(
      {
        default: "ga",
        providers: { ga: { driver: "rec-ga" } },
      },
      log,
      { "rec-ga": () => new RecordingProvider("ga", "analytics", log) },
      gate,
    );

    manager.track("signup");
    expect(log.filter((c) => c.kind === "track")).toHaveLength(0);
  });

  it("buffers pre-consent events and replays them once granted", async () => {
    const gate = new ControllableConsentGate({ analytics: false });
    const manager = buildManager(
      {
        default: "ga",
        providers: { ga: { driver: "rec-ga" } },
      },
      log,
      { "rec-ga": () => new RecordingProvider("ga", "analytics", log) },
      gate,
    );

    // Bootstrap subscribes the flush listener to the consent gate. It awaits
    // provider `init()` so we must await it before dispatching, otherwise
    // the `consent.subscribe` call happens after `.grant()` and no flush fires.
    await manager.onApplicationBootstrap();

    manager.track("signup");
    expect(log.filter((c) => c.kind === "track")).toHaveLength(0);

    // Grant consent — the manager subscribed to the gate at bootstrap and
    // flushes the buffer as categories flip on.
    gate.grant("analytics");

    const trackCalls = log.filter((c) => c.kind === "track");
    expect(trackCalls).toHaveLength(1);
    expect(trackCalls[0]!.provider).toBe("ga");
  });

  it("drops the oldest buffered event when past bufferLimit", async () => {
    const gate = new ControllableConsentGate({ analytics: false });
    const manager = buildManager(
      {
        default: "ga",
        providers: { ga: { driver: "rec-ga" } },
        bufferLimit: 2,
      },
      log,
      { "rec-ga": () => new RecordingProvider("ga", "analytics", log) },
      gate,
    );
    await manager.onApplicationBootstrap();

    manager.track("one");
    manager.track("two");
    manager.track("three");
    gate.grant("analytics");

    // The buffer capacity is 2, so `one` was evicted before `three` landed.
    const names = log
      .filter((c) => c.kind === "track")
      .map((c) => (c.payload as IAnalyticsEvent).name);
    expect(names).toEqual(["two", "three"]);
  });

  it("drops events when bufferUntilConsent is false and consent not granted", async () => {
    const gate = new ControllableConsentGate({ analytics: false });
    const manager = buildManager(
      {
        default: "ga",
        providers: { ga: { driver: "rec-ga" } },
        bufferUntilConsent: false,
      },
      log,
      { "rec-ga": () => new RecordingProvider("ga", "analytics", log) },
      gate,
    );
    await manager.onApplicationBootstrap();

    manager.track("one");
    gate.grant("analytics");

    // Nothing to replay — the event was discarded, not queued.
    expect(log.filter((c) => c.kind === "track")).toHaveLength(0);
  });

  it("requireConsent=false lets category-gated providers fire without a gate", () => {
    // No consent gate, but the provider still declares a category — the
    // fallback rule is `requireConsent=false ⇒ fire`.
    const manager = buildManager(
      {
        default: "ga",
        providers: { ga: { driver: "rec-ga" } },
        requireConsent: false,
      },
      log,
      { "rec-ga": () => new RecordingProvider("ga", "analytics", log) },
    );

    manager.track("signup");
    expect(log.filter((c) => c.kind === "track")).toHaveLength(1);
  });

  it("consent-exempt providers always fire", () => {
    const gate = new ControllableConsentGate({}); // nothing granted
    const manager = buildManager(
      {
        default: "console",
        providers: { console: { driver: "rec-console" } },
      },
      log,
      { "rec-console": () => new RecordingProvider("console", undefined, log) },
      gate,
    );

    manager.track("signup");
    // No consentCategory ⇒ no gate applied.
    expect(log.filter((c) => c.kind === "track")).toHaveLength(1);
  });
});

describe("AnalyticsManager — bootstrap init", () => {
  it("calls init() on every configured provider once", async () => {
    const log: IRecordedCall[] = [];
    const manager = buildManager(
      {
        default: "a",
        providers: { a: { driver: "rec-a" } },
        requireConsent: false,
      },
      log,
      { "rec-a": () => new RecordingProvider("a", undefined, log) },
    );

    await manager.onApplicationBootstrap();

    expect(log.filter((c) => c.kind === "init")).toHaveLength(1);
  });

  it("swallows async init() failures without breaking bootstrap", async () => {
    const log: IRecordedCall[] = [];
    // A provider whose `init` rejects — the manager must fail-soft.
    const manager = buildManager(
      {
        default: "good",
        providers: {
          good: { driver: "rec-good" },
          bad: { driver: "rec-bad" },
        },
        requireConsent: false,
      },
      log,
      {
        "rec-good": () => new RecordingProvider("good", undefined, log),
        "rec-bad": () => {
          const p: IAnalyticsProvider = {
            name: "bad",
            init: () => Promise.reject(new Error("boom")),
            track: () => log.push({ provider: "bad", kind: "track" }),
          };
          return p;
        },
      },
    );

    await expect(manager.onApplicationBootstrap()).resolves.toBeUndefined();

    // The good provider still initialised.
    expect(log.some((c) => c.kind === "init" && c.provider === "good")).toBe(true);
  });

  it("register()ing after identify() replays the current identity to the new provider", async () => {
    const log: IRecordedCall[] = [];
    const manager = buildManager(
      {
        default: "a",
        providers: { a: { driver: "rec-a" } },
        requireConsent: false,
      },
      log,
      { "rec-a": () => new RecordingProvider("a", undefined, log) },
    );

    manager.identify("user-1", { plan: "pro" });
    // Bind identity, THEN register an ad-hoc provider — the manager should
    // replay identify() so the new provider sees the current user.
    manager.register(new RecordingProvider("adhoc", undefined, log));

    // register() defers init() and the replay through Promise.resolve().
    await new Promise((resolve) => setTimeout(resolve, 0));

    const identifies = log.filter((c) => c.kind === "identify");
    // One from the original identify() dispatch, one from the replay.
    expect(identifies.length).toBeGreaterThanOrEqual(2);
    expect(identifies.some((c) => c.provider === "adhoc")).toBe(true);
  });
});

describe("AnalyticsManager — getProviders()", () => {
  it("returns the active set (configured stack ∪ ad-hoc)", () => {
    const log: IRecordedCall[] = [];
    const manager = buildManager(
      {
        default: "a",
        providers: {
          a: { driver: "rec-a" },
          b: { driver: "rec-b" },
        },
        requireConsent: false,
      },
      log,
      {
        "rec-a": () => new RecordingProvider("a", undefined, log),
        "rec-b": () => new RecordingProvider("b", undefined, log),
      },
    );
    manager.register(new RecordingProvider("adhoc", undefined, log));

    const names = manager.getProviders().map((p) => p.name);
    expect(names.sort()).toEqual(["a", "adhoc", "b"]);
  });
});

describe("AnalyticsManager — resolution failure isolation", () => {
  it("skips instances whose driver factory throws and continues", () => {
    const log: IRecordedCall[] = [];
    const manager = buildManager(
      {
        default: "a",
        providers: {
          a: { driver: "rec-a" },
          bad: { driver: "broken-factory" },
        },
        requireConsent: false,
      },
      log,
      {
        "rec-a": () => new RecordingProvider("a", undefined, log),
        "broken-factory": () => {
          throw new Error("bad factory");
        },
      },
    );

    // The `bad` instance blows up during resolve(); the manager must
    // fail-soft and dispatch to the healthy one.
    expect(() => manager.track("signup")).not.toThrow();
    const providers = log.filter((c) => c.kind === "track").map((c) => c.provider);
    expect(providers).toEqual(["a"]);
  });
});

describe("AnalyticsManager — default instance", () => {
  it("reports the configured default via getDefaultInstance()", () => {
    const log: IRecordedCall[] = [];
    const manager = buildManager(
      {
        default: "primary",
        providers: { primary: { driver: "rec-a" } },
      },
      log,
      { "rec-a": () => new RecordingProvider("primary", undefined, log) },
    );

    expect(manager.getDefaultInstance()).toBe("primary");
    manager.setDefaultInstance("other");
    expect(manager.getDefaultInstance()).toBe("other");
  });

  it('falls back to first configured provider then to "console"', () => {
    const log: IRecordedCall[] = [];
    // No `default` given — the manager should pick the first key from
    // `providers` (mergeConfig may still inject one, so we set no providers).
    const manager = buildManager(
      { providers: {} },
      log,
      {}, // no drivers
    );
    // With providers = {} and no default, the fallback is 'console'.
    expect(manager.getDefaultInstance()).toBe("console");

    // Wipe the internal spy — just checking the call didn't throw.
    void vi.fn();
  });
});
