/**
 * @file context-diff-suppression.test.ts
 * @description Property 8 (Requirement 12.3) — identical consecutive
 *   snapshots yield exactly one sync.
 *
 *   The test drives a random sequence of context registrations, then
 *   flushes twice against a static registry state, and asserts the
 *   second flush is a no-op.
 */

import { describe, it } from "vitest";
import type { IAiClient, IAiConfig, IUiContextSnapshot } from "@stackra/contracts";

import { ContextRegistry } from "@/core/registries/context.registry";
import { PiiRedactor } from "@/core/services/pii-redactor.service";
import { ContextCollector } from "@/core/services/context-collector.service";
import { forAll, type IPrng } from "./property-test.helper";

const NAMES = ["a", "b", "c", "d", "e"];

function genRegistrations(r: IPrng): Array<{ key: string; snapshot: number; priority: number }> {
  const n = r.int(0, 8);
  const out: Array<{ key: string; snapshot: number; priority: number }> = [];
  for (let i = 0; i < n; i++) {
    out.push({ key: r.pick(NAMES), snapshot: r.int(0, 100), priority: r.int(0, 3) });
  }
  return out;
}

async function drainSyncCount(
  regs: Array<{ key: string; snapshot: number; priority: number }>,
): Promise<{
  first: number;
  second: number;
}> {
  const registry = new ContextRegistry();
  const synced: IUiContextSnapshot[] = [];
  const client = {
    syncContext: (s: IUiContextSnapshot) => {
      synced.push(s);
      return Promise.resolve();
    },
  } as unknown as IAiClient;
  const config: IAiConfig = {
    baseUrl: "https://x",
    authProvider: { getCredentials: () => Promise.resolve({}), refresh: () => Promise.resolve({}) },
    context: { debounceMs: 500, leaderGated: false },
  };
  const redactor = new PiiRedactor(config);
  const collector = new ContextCollector(registry, redactor, client, config);
  collector.onModuleInit();

  for (const r of regs) registry.register(r);
  await collector.flush();
  const first = synced.length;
  await collector.flush();
  const second = synced.length;

  return { first, second };
}

describe("Property 8: context-sync diff-suppression (Req 12.3)", () => {
  it("a second flush against an unchanged registry never emits a second sync", () => {
    forAll(
      (r) => genRegistrations(r),
      async (regs) => {
        const { first, second } = await drainSyncCount(regs);
        // first is 0 (empty registrations) or 1; second must equal first.
        if (first > 1) return false;
        if (second !== first) return false;
        return true;
      },
      { runs: 100 },
    );
  });
});
