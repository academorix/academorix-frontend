/**
 * @fileoverview Shortcut — registered keyboard binding.
 *
 * A shortcut binds a {@link KeyCombo} (or array of combos) to either
 * a route navigation or a runtime handler. When `type` is omitted,
 * the shortcut falls under the `general` type.
 *
 * @module @stackra/kbd
 * @category Interfaces
 */

import type { KeyCombo } from "./key-combo.interface";

/**
 * Scopes a shortcut to a specific UI surface.
 *
 * Shortcuts in the `"global"` scope always fire. Other scopes fire
 * only when the corresponding scope is currently active (managed by
 * {@link ShortcutRegistry.pushScope} / `popScope`). The default scope
 * for new registrations is `"global"`.
 */
export type ShortcutScope = "global" | string;

/**
 * Predicate evaluated before firing a shortcut.
 *
 * Common use: skip shortcuts while typing in inputs.
 *
 * @param event - The native keyboard event.
 * @returns `true` to allow the shortcut to fire.
 */
export type ShortcutGuard = (event: KeyboardEvent) => boolean;

/**
 * Common fields shared by every shortcut variant.
 */
interface ShortcutBase {
  /** Stable id for the binding (used to unregister). */
  id: string;
  /** Human-readable description shown in the help overlay / palette. */
  description: string;
  /** Combo(s) that trigger the binding. */
  combo: KeyCombo | KeyCombo[];
  /** Scope this binding belongs to. Defaults to `"global"`. */
  scope?: ShortcutScope;
  /**
   * Type id (matches a {@link CommandType.id}). Used for grouping
   * in the help overlay and command palette. Defaults to `"general"`.
   */
  type?: string;
  /**
   * Backwards-compatible alias for {@link ShortcutBase.type}. Kept so
   * existing consumers that use `category` keep working.
   */
  category?: string;
  /** Predicate evaluated before firing — return `false` to skip. */
  when?: ShortcutGuard;
  /**
   * When `true`, the shortcut fires even when an `<input>` /
   * `<textarea>` / contentEditable element has focus.
   *
   * @default false
   */
  allowInInput?: boolean;
  /**
   * Prevent the browser's default action when the combo matches.
   *
   * @default true
   */
  preventDefault?: boolean;
  /**
   * Stop event propagation when the combo matches.
   *
   * @default false
   */
  stopPropagation?: boolean;
  /**
   * Hide the binding from the help overlay / command palette.
   *
   * @default false
   */
  hidden?: boolean;
  /**
   * Conflict-resolution mode.
   *
   * @default "strict"
   */
  bindMode?: ShortcutBindMode;
  /** Free-form metadata bag (entity, tags, analytics, …). */
  meta?: Record<string, unknown>;
}

/**
 * Conflict-resolution mode for shortcut bindings.
 */
export type ShortcutBindMode = "strict" | "replace" | "stack";

/**
 * A shortcut that invokes a handler function when triggered.
 */
export interface ShortcutWithHandler extends ShortcutBase {
  /** The handler to invoke. */
  handler: (event: KeyboardEvent) => void | Promise<void>;
  /** Route shortcuts don't have a handler. */
  to?: never;
}

/**
 * A shortcut that navigates to a route when triggered.
 */
export interface ShortcutWithRoute extends ShortcutBase {
  /** Route path to navigate to. */
  to: string;
  /** Route shortcuts don't have a handler. */
  handler?: never;
}

/**
 * Discriminated union of every shortcut variant.
 */
export type Shortcut = ShortcutWithHandler | ShortcutWithRoute;
