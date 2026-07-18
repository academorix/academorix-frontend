/**
 * @file guard-registry.service.ts
 * @module @stackra/routing/guards/services
 * @description The routing guard registry.
 *
 *   Extends `BaseRegistry<string, IGuardEntry>` from `@stackra/support`.
 *   Populated by `GuardLoaderService` at `onApplicationBootstrap` from
 *   every `@Guard`-decorated class in the DI graph.
 */

import { Inject, Injectable, Optional } from "@stackra/container";
import { BaseRegistry } from "@stackra/support";
import type { ICanActivate, IGuardOptions, ILoggerManager } from "@stackra/contracts";
import { LOGGER_MANAGER } from "@stackra/contracts";

import type { IGuardEntry } from "@/core/interfaces";

/**
 * The routing guard registry.
 */
@Injectable()
export class GuardRegistryService extends BaseRegistry<string, IGuardEntry> {
  /** Monotonic counter used to break priority ties by declaration order. */
  private declarationCounter = 0;

  public constructor(
    @Optional() @Inject(LOGGER_MANAGER) private readonly loggerManager?: ILoggerManager,
  ) {
    super();
  }

  /**
   * Register a guard class discovered by the loader.
   *
   * @param options - Metadata stamped by `@Guard(...)`.
   * @param ctor    - Constructor to instantiate via DI at call time.
   * @returns `this` for chaining.
   */
  public registerGuard(options: IGuardOptions, ctor: new (...args: never[]) => ICanActivate): this {
    const entry: IGuardEntry = {
      options,
      ctor,
      declarationIndex: this.declarationCounter++,
    };
    if (this.has(options.name)) {
      // Duplicate name — log-and-replace rather than throw so bootstrap
      // never falls over from a stray double-registration.
      this.warn(`Duplicate guard name '${options.name}' — replacing the earlier registration.`);
      this.replace(options.name, entry);
    } else {
      this.register(options.name, entry);
    }
    return this;
  }

  /**
   * Reset the registry — test-only. Also resets the declaration
   * counter so re-registration reproduces original order.
   */
  public override clear(): this {
    super.clear();
    this.declarationCounter = 0;
    return this;
  }

  // ── Private ────────────────────────────────────────────────────

  /** Emit a warning through the optional logger. Fail-soft. */
  private warn(message: string): void {
    if (!this.loggerManager) return;
    try {
      this.loggerManager.create("routing.guards").warn(message);
    } catch {
      // fail-soft
    }
  }
}
