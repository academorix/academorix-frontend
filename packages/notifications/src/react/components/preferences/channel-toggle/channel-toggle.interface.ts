/**
 * @file channel-toggle.interface.ts
 * @module @stackra/notifications/react/components/preferences
 * @description Props for the {@link ChannelToggle} component.
 */

/**
 * Props accepted by {@link ChannelToggle}.
 *
 * All state is driven by the parent — the switch is kept dumb so
 * it can be reused for future per-child overrides + integration
 * tests bind directly against the prop bag.
 */
export interface ChannelToggleProps {
  /** Stable id used for `name` + `data-testid`. */
  readonly id: string;
  /** Human-readable label. */
  readonly label: string;
  /** Optional sub-label rendered below the primary label. */
  readonly note?: string;
  /** Current on/off state. */
  readonly isEnabled: boolean;
  /**
   * When `true`, the switch renders as read-only + on. Used for the
   * safety × os-notification pair which must always be enabled.
   */
  readonly isMandatoryOn?: boolean;
  /** Called when the user flips the switch. */
  readonly onChange: (next: boolean) => void;
}
