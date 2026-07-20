/**
 * @file guard-adapter.service.spec.ts
 * @module @stackra/routing/tests
 * @description Unit tests for the GuardAdapterService — converts a
 *   guard registry entry into a resolved pipeline entry at the guard
 *   priority.
 */

import { describe, expect, it } from "vitest";

import { DEFAULT_GUARD_PRIORITY } from "@/core/constants";
import { GuardAdapterService } from "@/guards/services/guard-adapter.service";
import type { ICanActivate } from "@stackra/contracts";
import type { IGuardEntry } from "@/core/interfaces";

/** Sample guard class — the adapter never invokes canActivate. */
class NoopGuard implements ICanActivate {
  public canActivate(): true {
    return true;
  }
}

describe("GuardAdapterService", () => {
  const adapter = new GuardAdapterService();

  it("produces a pipeline entry at the default guard priority", () => {
    const entry: IGuardEntry = {
      options: { name: "auth" },
      ctor: NoopGuard,
      declarationIndex: 0,
    };
    const resolved = adapter.toPipelineEntry(entry);
    expect(resolved).toEqual({
      kind: "guard",
      name: "auth",
      priority: DEFAULT_GUARD_PRIORITY,
      ctor: NoopGuard,
      source: "guard:auth",
    });
  });

  it("honours a custom priority on the guard options", () => {
    const entry: IGuardEntry = {
      options: { name: "auth", priority: 500 },
      ctor: NoopGuard,
      declarationIndex: 0,
    };
    const resolved = adapter.toPipelineEntry(entry);
    expect(resolved.priority).toBe(500);
  });

  it("does not touch the guard instance — it stores the ctor", () => {
    const entry: IGuardEntry = {
      options: { name: "auth" },
      ctor: NoopGuard,
      declarationIndex: 0,
    };
    const resolved = adapter.toPipelineEntry(entry);
    expect(resolved.ctor).toBe(NoopGuard);
  });
});
