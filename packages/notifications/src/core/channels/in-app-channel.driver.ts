/**
 * @file in-app-channel.driver.ts
 * @module @stackra/notifications/core/channels
 * @description Built-in `in-app` channel driver.
 *
 *   Forwards every payload dispatched by the
 *   {@link NotificationManager} to the
 *   {@link InAppNotificationCentre}. Auto-registered by
 *   `NotificationModule.forRoot` via a canonical
 *   `createSeedLoader` provider so consumers never `register()`
 *   this manually — but the class stays a standard `@Injectable()`
 *   so tests can construct it directly with a mock centre.
 */

import { Injectable } from '@stackra/container';

import type { INotificationChannelDriver, INotificationPayload } from '../interfaces';
import { InAppNotificationCentre } from '../services/in-app-notification-centre.service';

/**
 * The default in-app driver.
 */
@Injectable()
export class InAppChannelDriver implements INotificationChannelDriver {
  /** Channel id — matches `dispatch({ channels: ['in-app'] })`. */
  public readonly id = 'in-app';

  public constructor(private readonly centre: InAppNotificationCentre) {}

  /**
   * Enqueue the payload into the in-app centre.
   *
   * @param payload - The notification payload.
   */
  public async deliver(payload: INotificationPayload): Promise<void> {
    await this.centre.dispatch(payload);
  }
}
