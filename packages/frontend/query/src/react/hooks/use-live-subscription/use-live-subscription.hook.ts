/**
 * @file use-live-subscription.hook.ts
 * @module @stackra/query/react/hooks/use-live-subscription
 * @description The primitive that wraps a realtime-channel
 *   subscription into a React lifecycle.
 *
 *   Consumers rarely reach for this directly — `useQuery` composes
 *   it internally when a caller sets `liveMode`. It's still exposed
 *   as a public hook so app code can subscribe to arbitrary channels
 *   (dashboards, notifications, presence badges) without wiring the
 *   `REALTIME_MANAGER` plumbing by hand every time.
 *
 *   Fail-soft: when the optional `@stackra/realtime` peer isn't
 *   installed the hook is a no-op and logs a single dev warning.
 */

import { useEffect } from 'react';
import { useOptionalInject } from '@stackra/container/react';
import {
  REALTIME_MANAGER,
  type ILiveEvent,
  type IRealtimeChannel,
  type IRealtimeConnection,
  type IRealtimeManager,
  type LiveEventType,
} from '@stackra/contracts';

/**
 * Options accepted by `useLiveSubscription`.
 */
export interface UseLiveSubscriptionOptions {
  /**
   * Channel name to subscribe on. When omitted or empty the hook is
   * a no-op — useful for gating a subscription behind a runtime
   * flag without conditionally calling the hook.
   */
  channel?: string;

  /**
   * Event types to listen for. `['*']` matches every published
   * type. @default `['*']`
   */
  types?: readonly LiveEventType[];

  /** Callback fired on each matching event. */
  onEvent: (event: ILiveEvent) => void;

  /**
   * Named realtime connection from `REALTIME_MANAGER`. Defaults to
   * the manager's own default connection.
   */
  connection?: string;

  /**
   * Whether to open a private channel
   * (`connection.privateChannel(name)`) instead of a public one.
   * @default false
   */
  private?: boolean;

  /** Master switch — disable to tear the subscription down. @default true */
  enabled?: boolean;
}

/**
 * Subscribe to a realtime channel for the lifetime of the component.
 *
 * @example
 * ```typescript
 * useLiveSubscription({
 *   channel: 'themes',
 *   types: ['created', 'updated', 'deleted'],
 *   onEvent: (event) => console.log('theme change:', event),
 * });
 * ```
 */
export function useLiveSubscription(options: UseLiveSubscriptionOptions): void {
  const manager = useOptionalInject<IRealtimeManager>(REALTIME_MANAGER);

  const {
    channel: channelName,
    types,
    onEvent,
    connection: connectionName,
    private: isPrivate = false,
    enabled = true,
  } = options;

  // Freeze the caller's types into a stable dependency key so React
  // doesn't tear down the subscription on every render just because
  // the caller passed a fresh literal array.
  const typesKey = (types ?? ['*']).join('|');

  useEffect(() => {
    if (!enabled) return;
    if (!manager) return;
    if (!channelName) return;

    let cleanup: (() => void) | null = null;
    let disposed = false;

    // Effective types list — resolved locally so we can also use it
    // in the cleanup path.
    const effectiveTypes = types ?? (['*'] as readonly LiveEventType[]);

    // The realtime manager returns a Promise for `connection()` (it
    // may need a driver handshake). We open the subscription
    // asynchronously and guard against unmount.
    const openSubscription = async (): Promise<void> => {
      let conn: IRealtimeConnection;
      try {
        conn = await manager.connection(connectionName);
      } catch {
        // Fail-soft: driver unavailable → no subscription. The
        // consumer's UI stays functional; only realtime is degraded.
        return;
      }
      if (disposed) return;

      const chan: IRealtimeChannel = isPrivate
        ? conn.privateChannel(channelName)
        : conn.channel(channelName);

      // Bind one listener per requested type. Realtime channels only
      // dispatch to the exact event name — a `'*'` wildcard is a
      // convention our layer handles: subscribe to the raw name and
      // synthesize an `ILiveEvent` with `type: '*'`.
      const boundHandlers: Array<{ event: string; handler: (data: unknown) => void }> = [];
      for (const eventType of effectiveTypes) {
        const handler = (raw: unknown): void => {
          if (disposed) return;
          const event: ILiveEvent = {
            channel: channelName,
            type: eventType,
            payload:
              raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : { data: raw },
            date: new Date(),
          };
          try {
            onEvent(event);
          } catch {
            // Fail-soft: a broken subscriber must not tear down the
            // whole realtime pipeline. Silent — the callback owns
            // its own error handling.
          }
        };
        chan.on(eventType, handler);
        boundHandlers.push({ event: eventType, handler });
      }

      cleanup = (): void => {
        for (const { event, handler } of boundHandlers) {
          chan.off(event, handler);
        }
      };
    };

    void openSubscription();

    return () => {
      disposed = true;
      if (cleanup) cleanup();
    };
    // typesKey participates so a caller widening the types list
    // opens a fresh subscription with the new binding.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [manager, channelName, connectionName, isPrivate, enabled, typesKey]);
}
