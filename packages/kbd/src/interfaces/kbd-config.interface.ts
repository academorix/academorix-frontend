/**
 * @fileoverview KbdModuleOptions — runtime configuration for the kbd module.
 *
 * @module @stackra/kbd
 * @category Interfaces
 */

import type { KeyCombo } from "./key-combo.interface";

/**
 * Options for {@link KbdModule.forRoot}.
 */
export interface KbdModuleOptions {
  /**
   * Open the command palette with this combo.
   *
   * Pass `null` to disable the default trigger.
   *
   * @default { mod: true, key: "k" }
   */
  paletteShortcut?: KeyCombo | null;

  /**
   * Toggle the keyboard hints overlay with this combo.
   *
   * Pass `null` to disable the default trigger.
   *
   * @default { mod: true, key: "/" }
   */
  hintsShortcut?: KeyCombo | null;

  /**
   * Open the keyboard catalog with this combo.
   *
   * Pass `null` to disable the default trigger.
   *
   * @default { shift: true, key: "?" }
   */
  catalogShortcut?: KeyCombo | null;

  /**
   * When the palette is open, fire shortcut handlers anyway.
   *
   * @default false
   */
  shortcutsWhilePaletteOpen?: boolean;

  /**
   * Default scope used when registering a shortcut without an explicit
   * `scope` field.
   *
   * @default "global"
   */
  defaultScope?: string;

  /**
   * Default type id used when a shortcut / command omits `type`.
   *
   * @default "general"
   */
  defaultType?: string;

  /**
   * Theme applied to the command palette by default. Must match a
   * theme registered through `KbdModule.forFeature({ themes })` or
   * one of the built-in presets (`default`, `raycast`, `spotlight`).
   *
   * @default "default"
   */
  defaultPaletteTheme?: string;

  /**
   * Timeout (ms) between keystrokes in a sequence chord.
   *
   * @default 1500
   */
  sequenceTimeoutMs?: number;

  /**
   * Debounce applied to {@link CommandSource.resolve} calls, in milliseconds.
   *
   * @default 100
   */
  resolveDebounceMs?: number;

  /**
   * Maximum number of results displayed per category in the palette.
   *
   * @default 50
   */
  maxResultsPerCategory?: number;

  /**
   * Additional combos treated as reserved by the conflict checker. Use
   * canonical strings (`"mod+t"`, `"alt+f4"`).
   */
  reservedKeys?: string[];

  /**
   * Skip the development warning emitted when a registered combo
   * matches a known reserved combo.
   *
   * @default false
   */
  silenceReservedWarnings?: boolean;

  /**
   * Enable user-customizable shortcuts.
   *
   * When enabled, the {@link ShortcutCustomizationService} loads
   * overrides from storage on bootstrap and applies them to the
   * registry.
   *
   * @default true
   */
  enableCustomization?: boolean;

  /**
   * Storage key prefix for shortcut customization persistence.
   *
   * @default "kbd"
   */
  storagePrefix?: string;

  /**
   * Whether to include TanStack Hotkeys devtools.
   *
   * @default false
   */
  devtools?: boolean;
}
