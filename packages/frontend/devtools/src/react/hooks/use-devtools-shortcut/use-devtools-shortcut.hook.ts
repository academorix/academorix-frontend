/**
 * @file use-devtools-shortcut.hook.ts
 * @module @stackra/devtools/react/hooks
 * @description Bind the keyboard shortcut that toggles the devtools
 *   shell.
 *
 *   No-ops when `shortcut === false` or when running under SSR
 *   (`window` is undefined). The binding uses the capture phase so
 *   an application-level `preventDefault` on the same combo doesn't
 *   swallow it.
 */

import { Str } from "@stackra/support";
import { useEffect } from "react";

import type { IDevtoolsShortcut } from "@/core/interfaces";

/**
 * Bind a global keyboard combo that fires `onFire`.
 *
 * @param shortcut - The combo, or `false` to disable the binding.
 * @param onFire - Called when the combo matches.
 */
export function useDevtoolsShortcut(shortcut: IDevtoolsShortcut | false, onFire: () => void): void {
  useEffect(() => {
    // SSR guard — `window` is undefined during server renders.
    if (typeof window === "undefined") return;
    if (!shortcut) return;

    const target = window;

    // Snapshot the shortcut fields so the handler's closure is
    // stable — the effect re-registers if any field changes.
    const wantMeta = shortcut.meta ?? false;
    const wantCtrl = shortcut.ctrl ?? false;
    const wantAlt = shortcut.alt ?? false;
    const wantShift = shortcut.shift ?? false;
    const wantKey = Str.lower(shortcut.key);

    const handler = (event: KeyboardEvent): void => {
      // Match modifiers strictly — `wantMeta = true` requires the
      // Meta key to be down, and `wantMeta = false` requires it to
      // be up. Either exact match wins; a shortcut of
      // `{ meta: true, key: 'd' }` will NOT fire when Shift is also
      // held.
      if (event.metaKey !== wantMeta) return;
      if (event.ctrlKey !== wantCtrl) return;
      if (event.altKey !== wantAlt) return;
      if (event.shiftKey !== wantShift) return;
      if (Str.lower(event.key) !== wantKey) return;

      // Swallow the event — otherwise the browser's default binding
      // (or the app's) may still fire. Use `preventDefault` +
      // `stopPropagation` on the way up.
      event.preventDefault();
      event.stopPropagation();
      onFire();
    };

    target.addEventListener("keydown", handler, true /* capture */);
    return () => {
      target.removeEventListener("keydown", handler, true);
    };
  }, [shortcut, onFire]);
}
