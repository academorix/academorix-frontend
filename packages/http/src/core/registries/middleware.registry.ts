/**
 * Per-connection middleware registry.
 *
 * Stores `IHttpMiddleware` instances keyed by name, sorted by
 * priority (lower runs first). Implementation of
 * `IHttpMiddlewareRegistry` from `@stackra/contracts`.
 *
 * @module @stackra/http/registries/middleware-registry
 */

import { Injectable } from '@stackra/container';
import { BaseRegistry } from '@stackra/support';

import type {
  IHttpMiddleware,
  IHttpMiddlewareEntry,
  IHttpMiddlewareRegistry,
} from '@stackra/contracts';

/**
 * Priority-sorted middleware registry.
 */
@Injectable()
export class MiddlewareRegistry
  extends BaseRegistry<string, IHttpMiddleware>
  implements IHttpMiddlewareRegistry
{
  /** Sorted entries — rebuilt on every registration. */
  private sorted: IHttpMiddlewareEntry[] = [];

  /** @inheritdoc */
  public registerWithPriority(name: string, middleware: IHttpMiddleware, priority: number): void {
    this.register(name, middleware);

    // Drop any existing entry for this exact instance so re-registers
    // don't accumulate duplicates.
    this.sorted = this.sorted.filter((entry) => entry.middleware !== middleware);
    this.sorted.push({ priority, middleware });
    this.sorted.sort((a, b) => a.priority - b.priority);
  }

  /** @inheritdoc */
  public getSorted(): IHttpMiddleware[] {
    return this.sorted.map((entry) => entry.middleware);
  }

  /** @inheritdoc */
  public getEntries(): IHttpMiddlewareEntry[] {
    return [...this.sorted];
  }

  /** @inheritdoc */
  public override clear(): this {
    super.clear();
    this.sorted = [];
    return this;
  }
}
