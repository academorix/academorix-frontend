/**
 * Components Barrel Export
 *
 * All kbd components are accessed via the `Kbd` and `Keyboard` compound
 * namespaces. Type exports remain individually available for type annotations.
 *
 * @module @stackra/kbd
 * @category Components
 */

import { KbdProvider } from "./kbd-provider/kbd-provider.component";
import { KeyboardShortcut } from "./keyboard-shortcut/keyboard-shortcut.component";
import { CommandPalette } from "./command-palette/command-palette.component";
import { CommandTrigger } from "./command-trigger/command-trigger.component";
import { KeyboardCatalog } from "./keyboard-catalog/keyboard-catalog.component";
import { KeyboardCatalogTrigger } from "./keyboard-catalog-trigger/keyboard-catalog-trigger.component";
import { KeyboardHints } from "./keyboard-hints/keyboard-hints.component";
import { KeyboardHintsToggle } from "./keyboard-hints-toggle/keyboard-hints-toggle.component";
import { ShortcutHint } from "./shortcut-hint/shortcut-hint.component";
import { ShortcutRecorder } from "./shortcut-recorder/shortcut-recorder.component";
import { ShortcutDisplay } from "./shortcut-display/shortcut-display.component";

// ── Type Exports ────────────────────────────────────────────────────────────
export type { CommandPaletteProps } from "./command-palette/command-palette.component";
export type { ShortcutRecorderProps } from "./shortcut-recorder/shortcut-recorder.component";
export type { ShortcutDisplayProps } from "./shortcut-display/shortcut-display.component";
export type { KbdProviderProps } from "./kbd-provider/kbd-provider.component";

// ── Compound Namespaces ─────────────────────────────────────────────────────

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
};
