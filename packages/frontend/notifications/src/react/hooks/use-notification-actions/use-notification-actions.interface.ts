/**
 * @file use-notification-actions.interface.ts
 * @module @stackra/notifications/react/hooks
 * @description Return shape for {@link useNotificationActions}.
 */

import type { IDeliveryReport, INotificationPayload } from "@/core/interfaces";

/**
 * Value returned by {@link useNotificationActions}.
 *
 * Every action is a stable callback the caller wires into a
 * consumer's UI event handlers.
 */
export interface IUseNotificationActionsResult {
  /** Dispatch a notification through the manager. */
  readonly dispatch: (
    payload: INotificationPayload,
    options?: { readonly channels?: readonly string[] },
  ) => Promise<readonly IDeliveryReport[]>;
  /** Mark a single in-app entry as seen. */
  readonly markSeen: (id: string) => Promise<boolean>;
  /** Dismiss a single in-app entry. */
  readonly dismiss: (id: string) => Promise<boolean>;
  /** Clear the in-app centre. */
  readonly clear: () => Promise<void>;
}
