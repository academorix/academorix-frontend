/**
 * @file use-notification-centre.interface.ts
 * @module @stackra/notifications/react/hooks
 * @description Return shape for the {@link useNotificationCentre}
 *   hook.
 */

import type { INotificationManagerSnapshot } from "@/core/interfaces";

/**
 * Value returned by {@link useNotificationCentre} — the
 * manager-level snapshot (permission + registered channels).
 */
export type IUseNotificationCentreResult = INotificationManagerSnapshot;
