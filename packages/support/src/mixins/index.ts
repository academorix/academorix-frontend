/**
 * @file index.ts
 * @module @stackra/support/mixins
 * @description Public API barrel for class-factory mixins.
 *
 *   Each mixin ships as a pair: the factory function that decorates an
 *   arbitrary base class, and a standalone class that carries the same
 *   behaviour when no other base is needed.
 */

export { Conditionable, ConditionableClass } from "./conditionable.mixin";
export { Macroable, MacroableClass } from "./macroable.mixin";
