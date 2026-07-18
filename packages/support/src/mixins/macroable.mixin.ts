/**
 * @file macroable.ts
 * @module @stackra/support
 * @description Macroable mixin — enables runtime extension of classes with custom methods.
 *   Allows adding methods to a class at runtime via `Class.macro('name', fn)`,
 *   checking existence with `Class.hasMacro('name')`, and mixing in entire
 *   objects with `Class.mixin(obj)`.
 *
 *   Inspired by Laravel's `Illuminate\Support\Traits\Macroable`.
 *
 *   TypeScript caveats:
 *   - Macro methods are NOT type-safe at the call site (dynamic dispatch)
 *   - Use `instance.callMacro('name', ...args)` for explicit invocation
 *   - For type-safe extension, prefer registries or Manager.extend()
 *   - Macroable is best for utilities (Str, Arr) where runtime plugins add value
 *
 *   Two usage patterns:
 *   1. Mixin function: `class Str extends Macroable(BaseStr) {}`
 *   2. Standalone class: `class MyUtility extends MacroableClass {}`
 */

import type { Constructor } from "../types";
import type { IMacroable, IMacroableStatic, MacroFunction } from "../interfaces";

// Re-export from canonical homes so consumers who only import from
// this file can still reach the shapes.
export type { Constructor } from "../types";
export type { IMacroable, IMacroableStatic, MacroFunction } from "../interfaces";

/**
 * Macroable mixin factory — adds runtime-extensible methods to any class.
 *
 * Adds static methods: `macro()`, `hasMacro()`, `flushMacros()`, `mixin()`
 * Adds instance method: `callMacro(name, ...args)` for invoking macros
 *
 * @example
 * ```typescript
 * import { Macroable } from '@stackra/support';
 *
 * class Str extends Macroable(Object) {
 *   static upper(value: string): string { return value.toUpperCase(); }
 * }
 *
 * // Register a macro at runtime
 * Str.macro('shout', function(this: typeof Str, value: string) {
 *   return value.toUpperCase() + '!!!';
 * });
 *
 * // Check existence
 * Str.hasMacro('shout'); // true
 *
 * // Call via instance
 * const str = new Str();
 * str.callMacro('shout', 'hello'); // 'HELLO!!!'
 *
 * // Mix in an object's methods
 * Str.mixin({
 *   reverse(value: string) { return value.split('').reverse().join(''); },
 *   repeat(value: string, n: number) { return value.repeat(n); },
 * });
 * ```
 *
 * @param Base - The base class to extend
 * @returns A new class with macro capabilities
 */
export function Macroable<TBase extends Constructor>(Base: TBase) {
  class MacroableMixin extends Base implements IMacroable {
    /** Static registry of all macros for this class. */
    static _macros: Map<string, MacroFunction> = new Map();

    // ══════════════════════════════════════════════════════════════════════════
    // Static Methods
    // ══════════════════════════════════════════════════════════════════════════

    /**
     * Register a custom macro on the class.
     *
     * @param name - Unique macro name (used to call it later)
     * @param fn - Function to execute. Receives `this` bound to the instance.
     */
    public static macro(name: string, fn: MacroFunction): void {
      MacroableMixin._macros.set(name, fn);
    }

    /**
     * Check if a macro with the given name is registered.
     *
     * @param name - Macro name to check
     * @returns True if the macro exists
     */
    public static hasMacro(name: string): boolean {
      return MacroableMixin._macros.has(name);
    }

    /**
     * Remove all registered macros.
     */
    public static flushMacros(): void {
      MacroableMixin._macros.clear();
    }

    /**
     * Mix all methods from an object into the class as macros.
     *
     * Iterates all own enumerable properties of the mixin. Functions
     * are registered as macros; non-functions are ignored.
     *
     * @param mixin - Object whose function properties become macros
     * @param replace - Whether to overwrite existing macros (default: true)
     */
    public static mixin(mixin: object, replace: boolean = true): void {
      const methods = Object.getOwnPropertyNames(mixin).filter(
        (name) => typeof (mixin as any)[name] === "function" && name !== "constructor",
      );

      for (const name of methods) {
        if (replace || !MacroableMixin.hasMacro(name)) {
          MacroableMixin.macro(name, (mixin as any)[name]);
        }
      }
    }

    /**
     * Get all registered macro names.
     *
     * @returns Array of macro names
     */
    public static getMacroNames(): string[] {
      return [...MacroableMixin._macros.keys()];
    }

    // ══════════════════════════════════════════════════════════════════════════
    // Instance Methods
    // ══════════════════════════════════════════════════════════════════════════

    /**
     * Call a registered macro by name, binding `this` to the current instance.
     *
     * @param name - The macro name to invoke
     * @param args - Arguments to pass to the macro function
     * @returns The macro's return value
     * @throws Error if no macro with that name is registered
     *
     * @example
     * ```typescript
     * const str = new Str();
     * str.callMacro('shout', 'hello'); // 'HELLO!!!'
     * ```
     */
    public callMacro(name: string, ...args: unknown[]): unknown {
      const macro = MacroableMixin._macros.get(name);

      if (!macro) {
        throw new Error(`Macro [${name}] is not registered on [${this.constructor.name}].`);
      }

      return macro.call(this, ...args);
    }

    /**
     * Check if a macro exists (instance-level convenience).
     *
     * @param name - Macro name to check
     * @returns True if the macro exists
     */
    public hasMacro(name: string): boolean {
      return MacroableMixin._macros.has(name);
    }
  }

  return MacroableMixin as typeof MacroableMixin & TBase & IMacroableStatic;
}

/**
 * Standalone Macroable base class — extend directly when no other base is needed.
 *
 * @example
 * ```typescript
 * import { MacroableClass } from '@stackra/support';
 *
 * class CustomUtility extends MacroableClass {
 *   doSomething(): string { return 'built-in'; }
 * }
 *
 * CustomUtility.macro('doSomethingElse', function() {
 *   return 'from macro';
 * });
 *
 * const util = new CustomUtility();
 * util.callMacro('doSomethingElse'); // 'from macro'
 * ```
 */
export class MacroableClass implements IMacroable {
  /** Static registry of all macros for this class. */
  private static _macros: Map<string, MacroFunction> = new Map();

  /**
   * Register a custom macro on the class.
   *
   * @param name - Unique macro name
   * @param fn - Function to execute when the macro is called
   */
  public static macro(name: string, fn: MacroFunction): void {
    MacroableClass._macros.set(name, fn);
  }

  /**
   * Check if a macro with the given name is registered.
   *
   * @param name - Macro name to check
   * @returns True if the macro exists
   */
  public static hasMacro(name: string): boolean {
    return MacroableClass._macros.has(name);
  }

  /**
   * Remove all registered macros.
   */
  public static flushMacros(): void {
    MacroableClass._macros.clear();
  }

  /**
   * Mix all methods from an object into the class as macros.
   *
   * @param mixin - Object whose function properties become macros
   * @param replace - Whether to overwrite existing macros (default: true)
   */
  public static mixin(mixin: object, replace: boolean = true): void {
    const methods = Object.getOwnPropertyNames(mixin).filter(
      (name) => typeof (mixin as any)[name] === "function" && name !== "constructor",
    );

    for (const name of methods) {
      if (replace || !MacroableClass.hasMacro(name)) {
        MacroableClass.macro(name, (mixin as any)[name]);
      }
    }
  }

  /**
   * Get all registered macro names.
   *
   * @returns Array of macro names
   */
  public static getMacroNames(): string[] {
    return [...MacroableClass._macros.keys()];
  }

  /**
   * Call a registered macro by name.
   *
   * @param name - The macro name to invoke
   * @param args - Arguments to pass to the macro function
   * @returns The macro's return value
   * @throws Error if no macro with that name is registered
   */
  public callMacro(name: string, ...args: unknown[]): unknown {
    const macro = MacroableClass._macros.get(name);

    if (!macro) {
      throw new Error(`Macro [${name}] is not registered on [${this.constructor.name}].`);
    }

    return macro.call(this, ...args);
  }

  /**
   * Check if a macro exists (instance-level convenience).
   *
   * @param name - Macro name to check
   * @returns True if the macro exists
   */
  public hasMacro(name: string): boolean {
    return MacroableClass._macros.has(name);
  }
}
