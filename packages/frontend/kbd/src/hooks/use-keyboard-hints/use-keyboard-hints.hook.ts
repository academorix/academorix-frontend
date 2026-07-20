/**
 * @fileoverview useKeyboardHints — read hints visibility in React.
 *
 * Uses `useStore()` from TanStack Store for fine-grained subscriptions.
 * Components only re-render when the visibility flag changes.
 *
 * @module @stackra/kbd
 * @category Hooks
 */

import { useSelector } from "@tanstack/react-store";
import { useInject } from "@stackra/container/react";
import type { Store } from "@tanstack/store";

import { KEYBOARD_HINTS_STORE, KEYBOARD_HINTS_SERVICE } from "../../tokens";
import type { KeyboardHintsService } from "../../services/keyboard-hints.service";
import type { UseKeyboardHintsResult } from "../../interfaces/use-keyboard-hints-result.interface";

/**
 * Read the keyboard-hints visibility flag and toggle it.
 *
 * Uses TanStack Store for reactive subscriptions — no manual subscribe
 * pattern. The component re-renders only when the store state changes.
 *
 * @returns Hints visibility + service actions.
 */
export function useKeyboardHints(): UseKeyboardHintsResult {
  const store = useInject<Store<{ visible: boolean }>>(KEYBOARD_HINTS_STORE);
  const service = useInject<KeyboardHintsService>(KEYBOARD_HINTS_SERVICE);
  const { visible } = useSelector(store);

  return {
    visible,
    service,
    show: service.show.bind(service),
    hide: service.hide.bind(service),
    toggle: service.toggle.bind(service),
  };
}
