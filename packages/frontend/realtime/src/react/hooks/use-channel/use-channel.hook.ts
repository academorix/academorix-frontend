/**
 * @file use-channel.hook.ts
 * @module @stackra/realtime/react
 * @description React hook for subscribing to a realtime channel.
 */

import { useEffect, useRef } from 'react';
import { useInject } from '@stackra/container/react';
import { REALTIME_MANAGER } from '@stackra/contracts';
import { RealtimeManager } from '@/core/services/realtime-manager.service';
import type { IRealtimeChannel } from '@/core/interfaces/realtime-connection.interface';

/**
 * Subscribe to a realtime channel and listen for events.
 *
 * Automatically leaves the channel on unmount.
 *
 * @param channelName - The channel to subscribe to
 * @param event - The event to listen for
 * @param handler - Callback invoked when the event fires
 *
 * @example
 * ```typescript
 * function OrderUpdates({ orderId }: Props) {
 *   useChannel(`orders.${orderId}`, 'updated', (data) => {
 *     setOrder(data);
 *   });
 *
 *   return <OrderDisplay order={order} />;
 * }
 * ```
 */
export function useChannel(
  channelName: string,
  event: string,
  handler: (data: unknown) => void
): void {
  const manager = useInject<RealtimeManager>(REALTIME_MANAGER);
  const handlerRef = useRef(handler);
  handlerRef.current = handler;
  const channelRef = useRef<IRealtimeChannel | null>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const conn = await manager.connection();
        if (cancelled) return;
        const channel = conn.channel(channelName);
        channelRef.current = channel;
        channel.on(event, (data: unknown) => handlerRef.current(data));
      } catch {
        // Connection not available — silent fail
      }
    })();

    return () => {
      cancelled = true;
      channelRef.current?.leave();
      channelRef.current = null;
    };
  }, [manager, channelName, event]);
}
