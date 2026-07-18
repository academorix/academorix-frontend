/**
 * @fileoverview useHeldKeys / useKeyHold — track currently held keys.
 *
 * Re-exports TanStack Hotkeys' key state tracking hooks with
 * consistent naming for the kbd package API.
 *
 * @module @stackra/kbd
 * @category Hooks
 */

import {
  useHeldKeys as useTanStackHeldKeys,
  useKeyHold as useTanStackKeyHold,
} from "@tanstack/react-hotkeys";

export type HeldKey = { key: string; code: string; timestamp: number };

/**
 * Returns an array of all currently held (pressed) keys.
 *
 * Useful for building power-user UIs that show modifier state
 * (like Figma's spacebar-for-pan indicator).
 *
 * @example
 * ```tsx
 * function ModifierIndicator() {
 *   const heldKeys = useHeldKeys();
 *   return (
 *     <div>
 *       {heldKeys.includes("Shift") && <span>⇧ Shift held</span>}
 *       {heldKeys.includes("Meta") && <span>⌘ Command held</span>}
 *     </div>
 *   );
 * }
 * ```
 */
export function useHeldKeys(): string[] {
  return useTanStackHeldKeys();
}

/**
 * Returns whether a specific key is currently held down.
 *
 * @param key - The key to track (e.g. `"Shift"`, `"Space"`, `"Meta"`).
 * @returns `true` while the key is pressed.
 *
 * @example
 * ```tsx
 * function PanMode() {
 *   const isSpaceHeld = useKeyHold("Space");
 *   return isSpaceHeld ? <span>Pan mode active</span> : null;
 * }
 * ```
 */
export function useKeyHold(key: any): boolean {
  return useTanStackKeyHold(key);
}
