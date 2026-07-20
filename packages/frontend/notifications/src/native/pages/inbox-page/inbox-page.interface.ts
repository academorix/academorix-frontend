/**
 * @file inbox-page.interface.ts
 * @module @stackra/notifications/native/pages
 * @description Props for the native {@link InboxPage} component.
 */

import type { NotificationWriter } from "../../hooks";

/**
 * Props accepted by the native {@link InboxPage}.
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
  /** Additional Uniwind classes appended to the root. */
  readonly className?: string;
}
