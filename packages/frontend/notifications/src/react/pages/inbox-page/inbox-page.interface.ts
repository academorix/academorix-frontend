/**
 * @file inbox-page.interface.ts
 * @module @stackra/notifications/react/pages
 * @description Props for the {@link InboxPage} component.
 */

import type { NotificationWriter } from '../../hooks/use-notification-writes';

/**
 * Props accepted by {@link InboxPage}.
 */
export interface InboxPageProps {
  /**
   * Optional writer bundle for network persistence.
   */
  readonly writer?: Partial<NotificationWriter>;
  /**
   * Optional callback fired when the user activates the
   * "Preferences" affordance in the header. Hidden when omitted.
   */
  readonly onOpenPreferences?: () => void;
  /** Additional CSS classes appended to the root. */
  readonly className?: string;
}
