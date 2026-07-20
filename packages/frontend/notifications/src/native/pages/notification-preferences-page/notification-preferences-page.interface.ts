/**
 * @file notification-preferences-page.interface.ts
 * @module @stackra/notifications/native/pages
 * @description Props for the native
 *   {@link NotificationPreferencesPage} component.
 */

import type { ChannelDescriptor } from "../../components/preferences/category-preferences-panel";
import type { NotificationWriter } from "../../hooks";

/**
 * Props accepted by the native {@link NotificationPreferencesPage}.
 */
export interface NotificationPreferencesPageProps {
  /**
   * Channels the preferences page exposes per category. Defaults
   * to `in-app` + `os-notification` (native surfaces don't ship an
   * email adapter by default).
   */
  readonly channels?: readonly ChannelDescriptor[];
  /** Optional writer bundle for network persistence. */
  readonly writer?: Partial<NotificationWriter>;
  /** Additional Uniwind classes appended to the root. */
  readonly className?: string;
}
