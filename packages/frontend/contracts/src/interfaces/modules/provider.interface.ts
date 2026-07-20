/**
 * @file provider.interface.ts
 * @module @stackra/contracts/interfaces/modules
 * @description Provider *shape* interfaces — Class, Value, Factory, Existing.
 *   The `Provider` union type lives in `../../types/provider.type.ts` because
 *   it's a discriminated union, not an interface.
 */

import type { Scope } from "@/enums/scope.enum";
import type { InjectionToken } from "@/types/injection-token.type";
import type { OptionalFactoryDependency } from "@/types/optional-factory-dependency.type";
import type { Type } from "@/interfaces/type.interface";

/**
 * Interface defining a *Class* type provider.
 *
 * @publicApi
 */
export interface ClassProvider<T = any> {
  /** Injection token. */
  provide: InjectionToken;
  /** Class to instantiate for this token. */
  useClass: Type<T>;
  /** Optional scope for the provider's lifetime. */
  scope?: Scope;
  /** Not valid on class providers — factory-only. */
  inject?: never;
  /** Only valid when scope is REQUEST — allows lazy DI subtrees. */
  durable?: boolean;
}

/**
 * Interface defining a *Value* type provider.
 *
 * @publicApi
 */
export interface ValueProvider<T = any> {
  /** Injection token. */
  provide: InjectionToken;
  /** Pre-existing value to bind. */
  useValue: T;
  /** Not valid on value providers — factory-only. */
  inject?: never;
}

/**
 * Interface defining a *Factory* type provider.
 *
 * @publicApi
 */
export interface FactoryProvider<T = any> {
  /** Injection token. */
  provide: InjectionToken;
  /** Factory function returning the instance (may be async). */
  useFactory: (...args: any[]) => T | Promise<T>;
  /** Tokens passed to the factory in order. */
  inject?: Array<InjectionToken | OptionalFactoryDependency>;
  /** Optional scope for the provider's lifetime. */
  scope?: Scope;
  /** Only valid when scope is REQUEST — allows lazy DI subtrees. */
  durable?: boolean;
}

/**
 * Interface defining an *Existing* (aliased) type provider.
 *
 * @publicApi
 */
export interface ExistingProvider<_T = any> {
  /** Injection token. */
  provide: InjectionToken;
  /** Provider whose value should be aliased under `provide`. */
  useExisting: any;
}
