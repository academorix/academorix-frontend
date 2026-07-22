/**
 * @file use-keyboard-hints-result.interface.ts
 * UseKeyboardHintsResult — Interface.
 *
 * @module @stackra/kbd/interfaces
 */

import type { KeyboardHintsService } from "../services/keyboard-hints.service";

/**
 * Combined return shape — hints visibility plus imperative actions.
 */
export interface UseKeyboardHintsResult {
  visible: boolean;
  show: () => void;
  hide: () => void;
  toggle: () => void;
  service: KeyboardHintsService;
}
