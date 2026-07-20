/**
 * @file notification-preferences-page.interface.ts
 * @module @stackra/notifications/react/pages
 * @description Props for the {@link NotificationPreferencesPage}
 *   component.
 */

import type { ChannelDescriptor } from "../../components/preferences/category-preferences-panel";
import type { NotificationWriter } from "../../hooks/use-notification-writes";

/**
 * Props accepted by {@link NotificationPreferencesPage}.
 */
export interface NotificationPreferencesPageProps {
  /**
   * Channels the preferences page exposes per category.
   *
   * When omitted, a sensible default surface is used
   * (`in-app`, `os-notification`, `email`).
   */
  readonly channels?: readonly ChannelDescriptor[];
  /**
   * Optional writer bundle for network persistence.
   */
  readonly writer?: Partial<NotificationWriter>;
  /** Additional CSS classes appended to the root. */
  readonly className?: string;
}
