/**
 * @file channel-toggle.interface.ts
 * @module @stackra/notifications/native/components/preferences
 * @description Props for the native
 *   {@link ChannelToggle} component.
 */

/**
 * Props accepted by the native {@link ChannelToggle}.
 *
 * All state is driven by the parent — the switch is kept dumb so
 * the same component can be reused for future per-child overrides
 * and integration tests bind directly against the prop bag.
 */
export interface ChannelToggleProps {
  /** Stable id used for the accessibility label. */
  readonly id: string;
  /** Human-readable label. */
  readonly label: string;
  /** Optional sub-label rendered below the primary label. */
  readonly note?: string;
  /** Current on/off state. */
  readonly isEnabled: boolean;
  /**
   * When `true`, the switch renders as read-only + on. Used for
   * the safety × os-notification pair which must always be
   * enabled.
   */
  readonly isMandatoryOn?: boolean;
  /** Called when the user flips the switch. */
  readonly onChange: (next: boolean) => void;
}
