/**
 * Per-connection interceptor registry.
 *
 * Mirrors `MiddlewareRegistry` but for `IHttpInterceptor` instances.
 *
 * @module @stackra/http/registries/interceptor-registry
 */

import { Injectable } from "@stackra/container";
import { BaseRegistry } from "@stackra/support";

import type {
  IHttpInterceptor,
  IHttpInterceptorEntry,
  IHttpInterceptorRegistry,
} from "@stackra/contracts";

/**
 * Priority-sorted interceptor registry.
 */
@Injectable()
export class InterceptorRegistry
  extends BaseRegistry<string, IHttpInterceptor>
  implements IHttpInterceptorRegistry
{
  /** Sorted entries — rebuilt on every registration. */
  private sorted: IHttpInterceptorEntry[] = [];

  /** @inheritdoc */
  public registerWithPriority(name: string, interceptor: IHttpInterceptor, priority: number): void {
    this.register(name, interceptor);

    this.sorted = this.sorted.filter((entry) => entry.interceptor !== interceptor);
    this.sorted.push({ priority, interceptor });
    this.sorted.sort((a, b) => a.priority - b.priority);
  }

  /** @inheritdoc */
  public getSorted(): IHttpInterceptor[] {
    return this.sorted.map((entry) => entry.interceptor);
  }

  /** @inheritdoc */
  public getEntries(): IHttpInterceptorEntry[] {
    return [...this.sorted];
  }

  /** @inheritdoc */
  public override clear(): this {
    super.clear();
    this.sorted = [];
    return this;
  }
}
