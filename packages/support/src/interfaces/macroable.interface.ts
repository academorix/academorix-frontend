/**
 * @file macroable.interface.ts
 * @module @stackra/support/interfaces
 * @description Interfaces for macroable classes.
 */

/** A macro function stored in the registry. */
export type MacroFunction = (...args: any[]) => any;

/** Instance interface for macroable classes. */
export interface IMacroable {
  callMacro(name: string, ...args: unknown[]): unknown;
}

/** Static interface for macroable classes. */
export interface IMacroableStatic {
  macro(name: string, fn: MacroFunction): void;
  hasMacro(name: string): boolean;
  flushMacros(): void;
  mixin(source: Record<string, MacroFunction>): void;
}
