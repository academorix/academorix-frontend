/**
 * @file keyboard.ts
 * @module lib/keyboard
 *
 * @description
 * Cross-cutting keyboard helpers used by the ⌘K palette, the `?` shortcut
 * sheet, and the leader-key hook (`G X` / `N X`).
 *
 * We deliberately keep this module runtime-free (no React) so the same
 * helpers can be reused by tests, storybook, and future Playwright specs.
 */

/** Operating system classes we care about for shortcut display. */
export type ShortcutOs = "mac" | "windows" | "linux" | "other";

/** Detects the current OS from the User-Agent — cheap and stable enough. */
export function detectOs(): ShortcutOs {
  if (typeof navigator === "undefined") return "other";

  const platform = navigator.platform ?? "";
  const ua = navigator.userAgent ?? "";

  if (/Mac|iPhone|iPad|iPod/.test(platform) || /Mac|iPhone|iPad|iPod/.test(ua)) return "mac";
  if (/Win/.test(platform)) return "windows";
  if (/Linux|X11/.test(platform)) return "linux";

  return "other";
}

/** Whether the target of a keydown event is an editable field (input / textarea / contenteditable). */
export function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  if (target.isContentEditable) return true;

  const tag = target.tagName;

  return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT";
}

/**
 * Turn a leader sequence like `"G A"` or `"Ctrl+K"` into its human-readable
 * form for the current OS. Splits on spaces (sequential presses) and `+`
 * (chords).
 *
 * @example
 * formatShortcut("Cmd+K", "mac") // "⌘K"
 * formatShortcut("Cmd+K", "windows") // "Ctrl K"
 * formatShortcut("G A", "mac") // "G A"
 */
export function formatShortcut(sequence: string, os: ShortcutOs = detectOs()): string {
  return sequence
    .split(" ")
    .map((chord) =>
      chord
        .split("+")
        .map((key) => keyGlyph(key.trim(), os))
        .join(os === "mac" ? "" : "+"),
    )
    .join(" ");
}

/** Renders a single key token as an OS-appropriate glyph. */
function keyGlyph(key: string, os: ShortcutOs): string {
  const canonical = key.toLowerCase();

  if (os === "mac") {
    switch (canonical) {
      case "cmd":
      case "command":
      case "meta":
        return "⌘";
      case "ctrl":
      case "control":
        return "⌃";
      case "alt":
      case "option":
        return "⌥";
      case "shift":
        return "⇧";
      case "enter":
      case "return":
        return "⏎";
      case "backspace":
        return "⌫";
      case "escape":
      case "esc":
        return "⎋";
      case "tab":
        return "⇥";
      case "up":
        return "↑";
      case "down":
        return "↓";
      case "left":
        return "←";
      case "right":
        return "→";
      default:
        return key.length === 1 ? key.toUpperCase() : key;
    }
  }

  switch (canonical) {
    case "cmd":
    case "command":
    case "meta":
      return "Win";
    case "ctrl":
    case "control":
      return "Ctrl";
    case "alt":
    case "option":
      return "Alt";
    case "shift":
      return "Shift";
    default:
      return key.length === 1 ? key.toUpperCase() : key;
  }
}

/**
 * Split a sequence into its parts. `"G A"` → `["G", "A"]`; `"Cmd+K"` →
 * `["Cmd+K"]`. Used by the leader-key hook to detect two-key sequences.
 */
export function splitSequence(sequence: string): string[] {
  return sequence.trim().split(/\s+/);
}

/** Normalize a single key token so a key event matches a declared sequence. */
export function normalizeKey(event: KeyboardEvent): string {
  if (event.key.length === 1) return event.key.toUpperCase();

  return event.key;
}
