/**
 * @fileoverview ShortcutRecorder — UI for recording custom shortcuts.
 *
 * Provides a button that, when clicked, starts recording key presses.
 * Shows the recorded combo in real-time and allows saving or canceling.
 * Integrates with the {@link ShortcutCustomizationService} for
 * conflict detection and persistence.
 *
 * @module @stackra/kbd
 * @category Components
 */

import { type ReactElement } from "react";
import { Button, Kbd } from "@stackra/ui/react";

import { useShortcutRecorder } from "../../hooks/use-hotkey-recorder/use-hotkey-recorder.hook";
import { useI18n } from "@stackra/i18n/react";

/**
 * Props for the {@link ShortcutRecorder} component.
 */
export interface ShortcutRecorderProps {
  /** The shortcut id to record a new combo for. */
  shortcutId: string;
  /** Callback fired after a successful save. */
  onSave?: () => void;
  /** Callback fired when recording is canceled. */
  onCancel?: () => void;
  /** Additional CSS class for the container. */
  className?: string;
}

/**
 * Inline shortcut recorder widget.
 *
 * Shows a "Record" button that, when pressed, captures the next key
 * combination. Displays the recorded combo with conflict warnings.
 *
 * @example
 * ```tsx
 * <ShortcutRecorder
 *   shortcutId="save-document"
 *   onSave={() => toast.success("Shortcut updated")}
 * />
 * ```
 */
export function ShortcutRecorder({
  shortcutId,
  onSave,
  onCancel,
  className,
}: ShortcutRecorderProps): ReactElement {
  const { t } = useI18n();
  const { isRecording, recordedDisplay, start, save, cancel, conflict } = useShortcutRecorder();

  const handleSave = () => {
    const conflictResult = save(shortcutId);
    if (!conflictResult) {
      onSave?.();
    }
  };

  const handleCancel = () => {
    cancel();
    onCancel?.();
  };

  if (!isRecording) {
    return (
      <div className={className}>
        <Button
          size="sm"
          variant="tertiary"
          onPress={() => {
            // Blur the button so focus moves to document body — the recorder
            // listens on document-level keydown (capture phase) and some
            // browsers/frameworks intercept keys when a button is focused.
            if (typeof document !== "undefined") {
              (document.activeElement as HTMLElement)?.blur();
            }
            start();
          }}
        >
          {t("kbd.components.shortcut_recorder.record")}
        </Button>
      </div>
    );
  }

  return (
    <div className={["flex items-center gap-2", className].filter(Boolean).join(" ")}>
      {/* Recorded keys display */}
      <div className="rounded-medium border-default-200 bg-default-50 flex min-w-[80px] items-center gap-1 border px-2 py-1">
        {recordedDisplay ? (
          <Kbd className="text-xs">
            <Kbd.Content>{recordedDisplay}</Kbd.Content>
          </Kbd>
        ) : (
          <span className="text-default-400 animate-pulse text-xs">
            {t("kbd.components.shortcut_recorder.press_keys")}
          </span>
        )}
      </div>

      {/* Actions */}
      <Button size="sm" variant="primary" onPress={handleSave} isDisabled={!recordedDisplay}>
        {t("kbd.components.shortcut_recorder.save")}
      </Button>
      <Button size="sm" variant="tertiary" onPress={handleCancel}>
        {t("kbd.components.shortcut_recorder.cancel")}
      </Button>

      {/* Conflict warning */}
      {conflict && (
        <span className="text-danger text-xs">
          {t("kbd.components.shortcut_recorder.conflicts_with")}: {conflict.shortcut.description}
        </span>
      )}
    </div>
  );
}
