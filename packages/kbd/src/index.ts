/**
 * @stackra/kbd
 *
 * Keyboard shortcut registry, command palette (⌘K), help catalog,
 * on-screen hints overlay, and presentation primitives.
 *
 * Powered by TanStack Hotkeys (core engine) + HeroUI Pro Command (UI).
 *
 * @module @stackra/kbd
 */

// ============================================================================
// Module
// ============================================================================
export { KbdModule } from "./kbd.module";

// ============================================================================
// Kbd Compound Namespace
// ============================================================================
import { KbdProvider } from "./components";
import { CommandPalette, CommandTrigger } from "./components";
import { KeyboardCatalog, KeyboardCatalogTrigger } from "./components";
import { KeyboardHints, KeyboardHintsToggle } from "./components";
import { KeyboardShortcut } from "./components";
import { ShortcutDisplay, ShortcutHint, ShortcutRecorder } from "./components";

/**
 * Kbd compound namespace — ergonomic access to all kbd components.
 *
 * @example
 * ```tsx
 * import { Kbd } from "@stackra/kbd";
 *
 * <Kbd.Provider>
 *   <Kbd.Command.Palette />
 *   <Kbd.Keyboard.Catalog />
 *   <Kbd.Keyboard.Hints />
 * </Kbd.Provider>
 * ```
 */
export const Kbd = {
  Provider: KbdProvider,
  Shortcut: KeyboardShortcut,
  Display: ShortcutDisplay,
  Hint: ShortcutHint,
  Recorder: ShortcutRecorder,
  Command: {
    Palette: CommandPalette,
    Trigger: CommandTrigger,
  },
  Keyboard: {
    Catalog: KeyboardCatalog,
    CatalogTrigger: KeyboardCatalogTrigger,
    Hints: KeyboardHints,
    HintsToggle: KeyboardHintsToggle,
  },
} as const;

// ============================================================================
// Hooks
// ============================================================================
export { useShortcut } from "./hooks";
export { useShortcutScope } from "./hooks";
export { useCommand } from "./hooks";
export { useCommandPalette } from "./hooks";
export { useKeyboardCatalog } from "./hooks";
export { useKeyboardHints } from "./hooks";
export { useDraggable } from "./hooks";
export { useShortcutRecorder } from "./hooks";
export type { UseShortcutRecorderResult } from "./hooks";
export { useHeldKeys, useKeyHold } from "./hooks";

// ============================================================================
// Components
// ============================================================================
export {
  KbdProvider,
  KeyboardShortcut,
  CommandPalette,
  CommandTrigger,
  KeyboardCatalog,
  KeyboardCatalogTrigger,
  KeyboardHints,
  KeyboardHintsToggle,
  ShortcutHint,
  ShortcutRecorder,
  ShortcutDisplay,
} from "./components";
export type {
  CommandPaletteProps,
  ShortcutRecorderProps,
  ShortcutDisplayProps,
  KbdProviderProps,
} from "./components";

// ============================================================================
// Registries
// ============================================================================
export { ShortcutRegistry } from "./registries";
export { CommandRegistry } from "./registries";
export { CommandTypeRegistry } from "./registries";
export { PaletteThemeRegistry } from "./registries";

// ============================================================================
// Services
// ============================================================================
export { CommandPaletteService } from "./services";
export { KeyboardListenerService } from "./services";
export { KeyboardCatalogService } from "./services";
export { KeyboardHintsService } from "./services";
export { ShortcutCustomizationService } from "./services";
export type { ShortcutConflict } from "./services";

// ============================================================================
// Utils
// ============================================================================
export { isMac } from "./utils";
export { normalizeKey } from "./utils";
export { matchCombo } from "./utils";
export { formatCombo } from "./utils";
export type { FormatComboOptions } from "./utils";
export { isTypingTarget } from "./utils";
export { resolveSequence } from "./utils";
export { comboToCanonical, isReservedBrowserCombo, RESERVED_BROWSER_COMBOS } from "./utils";
export { comboToHotkeyString, hotkeyStringToCombo, sequenceToKeys } from "./utils";

// ============================================================================
// Interfaces & Types
// ============================================================================
export type { KeyCombo, KeyComboModifiers } from "./interfaces";
export type { Shortcut, ShortcutScope, ShortcutGuard } from "./interfaces";
export type { Command, CommandContext, CommandHandler, CommandSource } from "./interfaces";
export type { KbdModuleOptions } from "./interfaces";
export type { CommandType } from "./interfaces";
export type {
  PaletteTheme,
  PaletteBackdropVariant,
  PaletteItemLayout,
  PaletteListDensity,
  PalettePlacement,
  PaletteSearchVariant,
} from "./interfaces";

// ============================================================================
// Constants
// ============================================================================
export { DEFAULT_COMMAND_TYPES, DEFAULT_TYPE_ID } from "./constants";

// ============================================================================
// Themes
// ============================================================================
export { defaultTheme, raycastTheme, shopifyTheme, spotlightTheme } from "./themes";
export { BUILTIN_PALETTE_THEMES } from "./themes";

// ============================================================================
// TanStack Hotkeys Re-exports
// ============================================================================
export { formatForDisplay, getHotkeyManager, getSequenceManager } from "@tanstack/react-hotkeys";
export type { HotkeyManager, Hotkey } from "@tanstack/react-hotkeys";
