/**
 * @file module-ref.ts
 * ModuleRef
 *
 * Public reference to the running DI context. Mirrors NestJS's
 * `ModuleRef` — services inject this class and call `moduleRef.get(token)`
 * to resolve instances at runtime (e.g. inside guards, factories, and
 * other places where compile-time injection isn't ergonomic).
 *
 * `ApplicationFactory.create()` registers a `ModuleRef` on every module
 * automatically, so any `@Injectable()` can take it as a constructor
 * dependency without extra wiring.
 *
 * @example
 * ```typescript
 * @Injectable()
 * export class GuardExecutor {
 *   constructor(private readonly moduleRef: ModuleRef) {}
 *
 *   public run(GuardClass: Type<IGuard>) {
 *     const guard = this.moduleRef.get(GuardClass);
 *     return guard.canActivate();
 *   }
 * }
 * ```
 *
 * @module @stackra/container/injector
 */

import { InjectionToken, Type } from "@stackra/contracts";

import type { ApplicationContext } from "@/core/application/application-context.service";
import { Module } from "./module";
import type { IModuleRefGetOptions } from "@/core/interfaces/module-ref-get-options.interface";

export type { IModuleRefGetOptions };

/**
 * Public reference to a running module context.
 *
 * Provides runtime token resolution against the bootstrapped DI
 * container. Always backed by the live `ApplicationContext`.
 */
export class ModuleRef {
  /**
   * @param appContext - The bootstrapped application context to delegate to
   * @param hostModule - The module this reference is scoped to (reserved
   *   for future module-strict resolution; currently delegates to the
   *   global app context)
   */
  public constructor(
    private readonly appContext: ApplicationContext,
    public readonly hostModule?: Module,
  ) {}

  /**
   * Resolve a service by its token.
   *
   * @typeParam T - The expected instance type
   * @param token - The injection token to resolve
   * @param options - Resolution options
   * @returns The resolved instance, or `undefined` when `optional: true`
   *   and the token is missing
   * @throws Error when the token can't be resolved and `optional` is
   *   not set
   */
  public get<T = any>(token: InjectionToken<T>, options: IModuleRefGetOptions = {}): T | undefined {
    if (options.optional) return this.appContext.getOptional<T>(token);
    return this.appContext.get<T>(token);
  }

  /**
   * Check whether a token is registered.
   *
   * @param token - The token to look up
   * @returns Whether the token resolves to anything in the container
   */
  public has(token: InjectionToken): boolean {
    return this.appContext.has(token);
  }

  /**
   * Get a scoped {@link ModuleRef} for a specific module class.
   *
   * @param moduleClass - The module class to scope to
   * @returns A new `ModuleRef` whose host module is the given class
   */
  public select<T>(moduleClass: Type<T>): ModuleRef {
    const scoped = this.appContext.select(moduleClass);
    // The scoped context exposes the same `get`/`getOptional` surface, so
    // we reuse it directly behind a fresh wrapper.
    return new ModuleRef(scoped as unknown as ApplicationContext);
  }
}
