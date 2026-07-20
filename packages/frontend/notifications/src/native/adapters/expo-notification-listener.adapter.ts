/**
 * @file expo-notification-listener.adapter.ts
 * @module @stackra/notifications/native/adapters
 * @description Listen for received notifications on React Native and
 *   forward them to the in-app notification centre.
 *
 *   `expo-notifications` is an optional peer — the adapter lazy-loads
 *   it and silently no-ops on non-Expo runtimes.
 */

import { Injectable } from '@stackra/container';

import { InAppNotificationCentre } from '@/core/services';
import type { INotificationPayload } from '@/core/interfaces';

/**
 * The subset of `expo-notifications` the listener needs.
 *
 * Kept narrow so a test doesn't need to stub the entire module.
 */
interface IExpoNotificationsListenerModule {
  addNotificationReceivedListener(
    listener: (event: {
      request?: {
        content?: {
          title?: string | null;
          body?: string | null;
          data?: Record<string, unknown> | null;
        };
      };
    }) => void
  ): { remove: () => void };
}

/**
 * Default lazy-loader for the optional peer.
 */
async function loadExpoNotifications(): Promise<IExpoNotificationsListenerModule | null> {
  try {
    const moduleName = 'expo-notifications';
    const mod = (await import(/* @vite-ignore */ moduleName)) as
      { default?: IExpoNotificationsListenerModule } | IExpoNotificationsListenerModule;
    return 'default' in mod && mod.default
      ? mod.default
      : (mod as IExpoNotificationsListenerModule);
  } catch {
    return null;
  }
}

/**
 * The Expo received-notification listener adapter.
 *
 * The manager binds this in `onModuleInit` — every notification the
 * OS routes to the app is forwarded to
 * {@link InAppNotificationCentre.dispatch} so the in-app centre
 * mirrors OS-tray content when the app is foregrounded.
 */
@Injectable()
export class ExpoNotificationListenerAdapter {
  /**
   * Test hook — override the module loader with a mock. Set to
   * `null` to fall back to the real `expo-notifications` import.
   */
  public loader: (() => Promise<IExpoNotificationsListenerModule | null>) | null = null;

  /** Cleanup handle returned by `addNotificationReceivedListener`. */
  private handle: { readonly remove: () => void } | null = null;

  public constructor(private readonly centre: InAppNotificationCentre) {}

  /**
   * Attach the listener. Idempotent — a second call replaces the
   * first subscription.
   *
   * @returns `true` when the listener was attached; `false` when
   *   the peer isn't available.
   */
  public async attach(): Promise<boolean> {
    // Detach the previous subscription so callers can safely re-invoke
    // `attach()` after a hot-reload (during dev) or during a manual
    // re-arm (settings screens).
    this.detach();
    const load = this.loader ?? loadExpoNotifications;
    const notifications = await load();
    if (!notifications) return false;
    this.handle = notifications.addNotificationReceivedListener((event) => {
      // Map Expo's event shape to a `INotificationPayload`. Missing
      // title / body default to empty strings so the payload
      // remains structurally valid even for silent pushes.
      const request = event.request;
      const content = request?.content;
      const payload: INotificationPayload = {
        title: content?.title ?? '',
        ...(content?.body ? { body: content.body } : {}),
        ...(content?.data ? { data: content.data } : {}),
      };
      // Dispatch is async — fire-and-forget matches Expo's own
      // listener contract, which doesn't await returned promises.
      void this.centre.dispatch(payload);
    });
    return true;
  }

  /** Remove the listener. Safe to call when nothing is attached. */
  public detach(): void {
    if (this.handle) {
      try {
        this.handle.remove();
      } catch {
        // fail-soft — the runtime may have already been torn down.
      }
      this.handle = null;
    }
  }
}
