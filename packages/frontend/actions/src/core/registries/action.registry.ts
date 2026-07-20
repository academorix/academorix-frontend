/**
 * @file action.registry.ts
 * @module @stackra/actions/core/registries
 * @description ActionRegistry — the name-keyed map of registered
 *   handlers, extending `BaseRegistry` from `@stackra/support`.
 */

import { Inject, Injectable, Optional } from "@stackra/container";
import { BaseRegistry } from "@stackra/support";
import type { IActionHandler, ILoggerManager } from "@stackra/contracts";
import { LOGGER_MANAGER } from "@stackra/contracts";

/**
 * Registry of action handlers keyed by `kind`.
 */
@Injectable()
export class ActionRegistry extends BaseRegistry<string, IActionHandler> {
  public constructor(
    @Optional() @Inject(LOGGER_MANAGER) private readonly loggerManager?: ILoggerManager,
  ) {
    super();
  }

  /**
   * Register a handler under the given kind — last-wins semantics.
   * A collision is warned about but the new handler replaces the old.
   */
  public override register(kind: string, handler: IActionHandler): this {
    if (this.has(kind)) {
      this.loggerManager
        ?.channel("actions", "actions")
        .warn(`[actions] Handler collision on kind "${kind}" — last-wins replacement.`);
      return this.replace(kind, handler);
    }
    return super.register(kind, handler);
  }

  /**
   * Resolve the handler for a kind, or `undefined` when none is registered.
   */
  public resolve(kind: string): IActionHandler | undefined {
    return this.get(kind);
  }

  /**
   * Remove a handler by kind. Returns `true` when the handler existed.
   */
  public unregister(kind: string): boolean {
    return this.remove(kind);
  }
}
