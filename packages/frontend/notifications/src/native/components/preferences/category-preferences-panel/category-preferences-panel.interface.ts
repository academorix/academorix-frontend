/**
 * @file category-preferences-panel.interface.ts
 * @module @stackra/notifications/native/components/preferences
 * @description Props for the native
 *   {@link CategoryPreferencesPanel} component.
 */

/**
 * A single channel row surfaced inside the preferences grid.
 */
export interface ChannelDescriptor {
  /** Machine-readable channel id. */
  readonly id: string;
  /** Human-readable label. */
  readonly label: string;
  /** Optional footnote — appears under the label. */
  readonly note?: string;
}

/**
 * Props accepted by the native {@link CategoryPreferencesPanel}.
 */
export interface CategoryPreferencesPanelProps {
  /** Channels the panel exposes per category. */
  readonly channels: readonly ChannelDescriptor[];
  /** Additional Uniwind classes appended to the root. */
  readonly className?: string;
}
