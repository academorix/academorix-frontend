/**
 * Hooks Barrel Export
 *
 * @module @stackra/kbd
 * @category Hooks
 */

export { useShortcut } from "./use-shortcut/use-shortcut.hook";
export { useShortcutScope } from "./use-shortcut-scope/use-shortcut-scope.hook";
export { useCommand } from "./use-command/use-command.hook";
export { useCommandPalette } from "./use-command-palette/use-command-palette.hook";
export { useKeyboardCatalog } from "./use-keyboard-catalog/use-keyboard-catalog.hook";
export { useKeyboardHints } from "./use-keyboard-hints/use-keyboard-hints.hook";
export { useDraggable } from "./use-draggable/use-draggable.hook";
export { useShortcutRecorder } from "./use-hotkey-recorder/use-hotkey-recorder.hook";
export type { UseShortcutRecorderResult } from "./use-hotkey-recorder/use-hotkey-recorder.hook";
export { useHeldKeys, useKeyHold } from "./use-held-keys/use-held-keys.hook";
