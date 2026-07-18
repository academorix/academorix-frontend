/**
 * @fileoverview useShortcutRecorder — record user key presses for customization.
 *
 * Wraps TanStack Hotkeys' `useHotkeyRecorder` with integration into
 * the {@link ShortcutCustomizationService} for conflict detection and
 * persistence.
 *
 * @module @stackra/kbd
 * @category Hooks
 */

import { useCallback, useState } from "react";
import { useHotkeyRecorder } from "@tanstack/react-hotkeys";
import { useInject } from "@stackra/container/react";

import { SHORTCUT_CUSTOMIZATION } from "../../tokens";
import type { KeyCombo } from "../../interfaces/key-combo.interface";
import type {
  ShortcutConflict,
  ShortcutCustomizationService,
} from "../../services/shortcut-customization.service";
import { hotkeyStringToCombo } from "../../utils/tanstack-adapter.util";

/**
 * Result returned by {@link useShortcutRecorder}.
 */
export interface UseShortcutRecorderResult {
  /** Whether the recorder is currently capturing key presses. */
  isRecording: boolean;
  /** The recorded combo (null until recording completes). */
  recordedCombo: KeyCombo | null;
  /** The recorded keys as a display string. */
  recordedDisplay: string;
  /** Start recording. */
  start: () => void;
  /** Stop recording and discard. */
  cancel: () => void;
  /** Save the recorded combo to a shortcut. */
  save: (shortcutId: string) => ShortcutConflict | null;
  /** Any conflict detected with the recorded combo. */
  conflict: ShortcutConflict | null;
  /** Check for conflicts without saving. */
  checkConflict: (shortcutId: string) => ShortcutConflict | null;
}

/**
 * Hook for recording keyboard shortcuts for user customization.
 *
 * Uses TanStack Hotkeys' recorder under the hood, with added
 * conflict detection and persistence through the customization service.
 *
 * @example
 * ```tsx
 * function ShortcutEditor({ shortcutId }: { shortcutId: string }) {
 *   const { isRecording, recordedDisplay, start, save, cancel, conflict } =
 *     useShortcutRecorder();
 *
 *   return (
 *     <div>
 *       {isRecording ? (
 *         <>
 *           <span>{recordedDisplay || "Press keys..."}</span>
 *           <button onClick={() => save(shortcutId)}>Save</button>
 *           <button onClick={cancel}>Cancel</button>
 *           {conflict && <span>Conflicts with: {conflict.shortcut.description}</span>}
 *         </>
 *       ) : (
 *         <button onClick={start}>Record</button>
 *       )}
 *     </div>
 *   );
 * }
 * ```
 */
export function useShortcutRecorder(): UseShortcutRecorderResult {
  const customization = useInject<ShortcutCustomizationService>(SHORTCUT_CUSTOMIZATION);
  const [conflict, setConflict] = useState<ShortcutConflict | null>(null);
  const [recordedCombo, setRecordedCombo] = useState<KeyCombo | null>(null);
  const [recordedDisplay, setRecordedDisplay] = useState("");
  const [isActive, setIsActive] = useState(false);

  const recorder = useHotkeyRecorder({
    onRecord: (hotkey) => {
      const combo = hotkeyStringToCombo(hotkey);
      setRecordedCombo(combo);
      setRecordedDisplay(hotkey);
      // Keep isActive true — user needs to Save or Cancel
    },
    onCancel: () => {
      setRecordedCombo(null);
      setRecordedDisplay("");
      setConflict(null);
      setIsActive(false);
    },
  });

  const start = useCallback(() => {
    setRecordedCombo(null);
    setRecordedDisplay("");
    setConflict(null);
    setIsActive(true);
    recorder.startRecording();
  }, [recorder]);

  const cancel = useCallback(() => {
    recorder.cancelRecording();
    setRecordedCombo(null);
    setRecordedDisplay("");
    setConflict(null);
    setIsActive(false);
  }, [recorder]);

  const checkConflict = useCallback(
    (shortcutId: string): ShortcutConflict | null => {
      if (!recordedCombo) return null;
      const result = customization.checkConflict(shortcutId, recordedCombo);
      setConflict(result);
      return result;
    },
    [customization, recordedCombo],
  );

  const save = useCallback(
    (shortcutId: string): ShortcutConflict | null => {
      if (!recordedCombo) return null;

      const conflictResult = customization.checkConflict(shortcutId, recordedCombo);
      if (conflictResult) {
        setConflict(conflictResult);
        return conflictResult;
      }

      customization.setCustomCombo(shortcutId, recordedCombo);
      recorder.cancelRecording();
      setRecordedCombo(null);
      setRecordedDisplay("");
      setConflict(null);
      setIsActive(false);
      return null;
    },
    [customization, recordedCombo, recorder],
  );

  return {
    isRecording: isActive,
    recordedCombo,
    recordedDisplay,
    start,
    cancel,
    save,
    conflict,
    checkConflict,
  };
}
