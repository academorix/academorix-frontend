/**
 * @file guard-adapter.service.ts
 * @module @stackra/routing/guards/services
 * @description Converts a guard entry into a middleware entry.
 *
 *   Per PLAN §8, guards run BEFORE regular middleware in the same
 *   pipeline. Rather than maintaining two chains, the adapter converts
 *   each guard registration into a middleware entry at guard-priority
 *   (default `1000`). Downstream code sees a single sorted pipeline.
 *
 *   NOTE: This is a pure adapter — no state. The resolver already
 *   handles the guard-vs-middleware kind distinction; the adapter
 *   exists so a future F.2 pipeline runner can uniformly execute the
 *   returned `IResolvedPipelineEntry` list without a discriminator
 *   switch.
 */

import { Inject, Injectable, Optional } from "@stackra/container";
import type { ILoggerManager } from "@stackra/contracts";
import { LOGGER_MANAGER } from "@stackra/contracts";

import type { IGuardEntry, IResolvedPipelineEntry } from "@/core/interfaces";
import { DEFAULT_GUARD_PRIORITY } from "@/core/constants";

/**
 * Adapter that maps a guard entry to a resolved pipeline entry.
 *
 * @example
 * ```typescript
 * const adapter = app.get(GuardAdapterService);
 * const entry = adapter.toPipelineEntry(registryEntry);
 * ```
 */
@Injectable()
export class GuardAdapterService {
  public constructor(
    @Optional()
    @Inject(LOGGER_MANAGER)
    // Optional logger — the adapter is pure today, but the field is
    // wired so a future F.2 debug hook can trace guard-to-middleware
    // conversions without a code-shape churn.
    private readonly loggerManager?: ILoggerManager,
  ) {}

  /**
   * Map a guard entry to a pipeline entry.
   *
   * @param entry - Guard registry entry.
   * @returns Resolved pipeline entry ready to feed into the runner.
   */
  public toPipelineEntry(entry: IGuardEntry): IResolvedPipelineEntry {
    // Trace-level log — invisible in prod, useful when the F.2
    // pipeline runner needs to explain "why did guard X show up
    // ahead of middleware Y" during dev.
    this.debug(`Adapting guard '${entry.options.name}' to pipeline entry.`);
    return {
      kind: "guard",
      name: entry.options.name,
      // Guards get their configured priority (or the default `1000`).
      // The value is captured here so downstream sorting can rank
      // guards vs middleware uniformly.
      priority: entry.options.priority ?? DEFAULT_GUARD_PRIORITY,
      ctor: entry.ctor,
      source: `guard:${entry.options.name}`,
    };
  }

  // ── Private ────────────────────────────────────────────────────

  /**
   * Emit a debug-level log. Fail-soft — the adapter must survive
   * without a logger wired.
   */
  private debug(message: string): void {
    if (!this.loggerManager) return;
    try {
      this.loggerManager.create("routing.guards").debug(message);
    } catch {
      // fail-soft — logger failures are never a fatal path here.
    }
  }
}
