/**
 * @fileoverview isTypingTarget — detect when the user is typing into a field.
 *
 * Used to skip global shortcuts while the user has focus inside an
 * input / textarea / contentEditable element. Shortcuts that explicitly
 * opt in via `Shortcut.allowInInput` bypass this check.
 *
 * @module @stackra/kbd
 * @category Utils
 */

import { Str } from "@stackra/support";

/**
 * Tags that should suppress shortcut firing when focused.
 */
const TYPING_TAGS = new Set(["INPUT", "TEXTAREA", "SELECT"]);

/**
 * Detect whether the event target is a typing surface.
 *
 * Returns `true` for `<input>`, `<textarea>`, `<select>`, and any
 * element with `contenteditable=true`.
 *
 * @param event - The keyboard event.
 * @returns `true` when the target is a typing surface.
 */
export function isTypingTarget(event: KeyboardEvent): boolean {
  const target = event.target as HTMLElement | null;
  if (!target) return false;
  if (TYPING_TAGS.has(target.tagName)) return true;
  if (target.isContentEditable) return true;
  const role = target.getAttribute("role");
  if (role && Str.lower(role) === "textbox") return true;
  return false;
}
