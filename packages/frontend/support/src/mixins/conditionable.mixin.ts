/**
 * @file conditionable.ts
 * @module @stackra/support
 * @description Conditionable mixin — adds `when()` and `unless()` methods to any class.
 *   Enables fluent conditional method chaining without breaking the chain:
 *
 *   ```typescript
 *   builder
 *     .where('status', 'active')
 *     .when(user.isAdmin, (b) => b.withDeleted())
 *     .unless(filters.isEmpty(), (b) => b.applyFilters(filters))
 *     .orderBy('created_at')
 *   ```
 *
 *   Inspired by Laravel's `Illuminate\Support\Traits\Conditionable`.
 *
 *   Two usage patterns:
 *   1. Mixin function: `class MyClass extends Conditionable(BaseClass) {}`
 *   2. Standalone class: `class MyClass extends ConditionableMixin {}`
 */

import type { Constructor } from "../types";
import type { IConditionable } from "../interfaces";

// Re-export from canonical homes so consumers who only import from
// this file can still reach the shapes.
export type { Constructor } from "../types";
export type { IConditionable } from "../interfaces";

/**
 * Conditionable mixin factory — adds `when()` and `unless()` to any class.
 *
 * Use as a mixin applied to a base class:
 *
 * @example
 * ```typescript
 * import { Conditionable } from '@stackra/support';
 *
 * class QueryBuilder extends Conditionable(BaseBuilder) {
 *   where(field: string, value: unknown): this { ... }
 *   withDeleted(): this { ... }
 * }
 *
 * const results = new QueryBuilder()
 *   .where('status', 'active')
 *   .when(user.isAdmin, (q) => q.withDeleted())
 *   .unless(search === '', (q) => q.where('name', search));
 * ```
 *
 * @param Base - The base class to extend
 * @returns A new class with `when()` and `unless()` methods
 */
export function Conditionable<TBase extends Constructor>(Base: TBase) {
  return class ConditionableMixin extends Base implements IConditionable {
    /**
     * Apply the callback if the given value is truthy.
     *
     * @param value - Condition to evaluate (value or lazy function returning value)
     * @param callback - Called with `this` and the resolved value when truthy
     * @param fallback - Called with `this` and the resolved value when falsy
     * @returns `this` for continued chaining
     */
    public when<T>(
      value: T | (() => T),
      callback?: (self: this, value: T) => this | void,
      fallback?: (self: this, value: T) => this | void,
    ): this {
      const resolved = typeof value === "function" ? (value as () => T)() : value;

      if (resolved) {
        return (callback?.(this, resolved) ?? this) as this;
      } else if (fallback) {
        return (fallback(this, resolved) ?? this) as this;
      }

      return this;
    }

    /**
     * Apply the callback if the given value is falsy.
     *
     * @param value - Condition to evaluate (value or lazy function returning value)
     * @param callback - Called with `this` and the resolved value when falsy
     * @param fallback - Called with `this` and the resolved value when truthy
     * @returns `this` for continued chaining
     */
    public unless<T>(
      value: T | (() => T),
      callback?: (self: this, value: T) => this | void,
      fallback?: (self: this, value: T) => this | void,
    ): this {
      const resolved = typeof value === "function" ? (value as () => T)() : value;

      if (!resolved) {
        return (callback?.(this, resolved) ?? this) as this;
      } else if (fallback) {
        return (fallback(this, resolved) ?? this) as this;
      }

      return this;
    }
  };
}

/**
 * Standalone Conditionable base class — extend directly when no other base is needed.
 *
 * @example
 * ```typescript
 * import { ConditionableClass } from '@stackra/support';
 *
 * class Pipeline extends ConditionableClass {
 *   private steps: string[] = [];
 *
 *   addStep(name: string): this {
 *     this.steps.push(name);
 *     return this;
 *   }
 * }
 *
 * const pipeline = new Pipeline()
 *   .addStep('validate')
 *   .when(needsAuth, (p) => p.addStep('authenticate'))
 *   .addStep('execute');
 * ```
 */
export class ConditionableClass implements IConditionable {
  /**
   * Apply the callback if the given value is truthy.
   *
   * @param value - Condition to evaluate
   * @param callback - Called when truthy
   * @param fallback - Called when falsy
   * @returns `this` for chaining
   */
  public when<T>(
    value: T | (() => T),
    callback?: (self: this, value: T) => this | void,
    fallback?: (self: this, value: T) => this | void,
  ): this {
    const resolved = typeof value === "function" ? (value as () => T)() : value;

    if (resolved) {
      return (callback?.(this, resolved) ?? this) as this;
    } else if (fallback) {
      return (fallback(this, resolved) ?? this) as this;
    }

    return this;
  }

  /**
   * Apply the callback if the given value is falsy.
   *
   * @param value - Condition to evaluate
   * @param callback - Called when falsy
   * @param fallback - Called when truthy
   * @returns `this` for chaining
   */
  public unless<T>(
    value: T | (() => T),
    callback?: (self: this, value: T) => this | void,
    fallback?: (self: this, value: T) => this | void,
  ): this {
    const resolved = typeof value === "function" ? (value as () => T)() : value;

    if (!resolved) {
      return (callback?.(this, resolved) ?? this) as this;
    } else if (fallback) {
      return (fallback(this, resolved) ?? this) as this;
    }

    return this;
  }
}
