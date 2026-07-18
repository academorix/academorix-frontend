/**
 * @file realtime.handler.ts
 * @module @stackra/realtime/actions
 * @description RealtimeHandler — dispatch handler for `ActionKind.Realtime`.
 *
 *   Handles `subscribe`, `unsubscribe`, and `publish` modes by delegating
 *   to the injected {@link RealtimeManager}. Receiving messages is the
 *   domain of `useRealtime` hooks and `@OnRealtimeEvent` listeners — this
 *   handler only manages subscription intent + outbound publish.
 */

import { Inject, Injectable } from '@stackra/container';
import type {
  IActionContext,
  IActionHandler,
  IActionResponse,
  IRealtimeAction,
} from '@stackra/contracts';
import { ActionKind, REALTIME_MANAGER } from '@stackra/contracts';
import type { RealtimeManager } from '../core/services/realtime-manager.service';

/**
 * `RealtimeHandler` — dispatch handler for `ActionKind.Realtime`.
 */
@Injectable()
export class RealtimeHandler implements IActionHandler<
  IRealtimeAction,
  { channel: string; mode: string }
> {
  public readonly kind = ActionKind.Realtime;

  public constructor(@Inject(REALTIME_MANAGER) private readonly manager: RealtimeManager) {}

  public async execute(
    descriptor: IRealtimeAction,
    context: IActionContext
  ): Promise<IActionResponse<{ channel: string; mode: string }>> {
    if (context.signal?.aborted) return { success: false, message: 'Aborted' };

    try {
      switch (descriptor.mode) {
        case 'publish': {
          const conn = await this.manager.connection();
          const channel = conn.channel(descriptor.channel);
          // `whisper` is the client-event send in the IRealtimeChannel
          // contract — other subscribers see the frame as an ordinary event.
          channel.whisper(descriptor.event ?? 'message', descriptor.payload);
          break;
        }
        case 'subscribe':
        case 'unsubscribe': {
          // Subscription intent is tracked implicitly by consumer hooks
          // and metadata-driven listener scanning. The handler acts as an
          // audit surface — no-op imperative side effect required.
          break;
        }
      }
      return { success: true, data: { channel: descriptor.channel, mode: descriptor.mode } };
    } catch (err) {
      return {
        success: false,
        message: err instanceof Error ? err.message : 'Realtime action failed',
      };
    }
  }
}
