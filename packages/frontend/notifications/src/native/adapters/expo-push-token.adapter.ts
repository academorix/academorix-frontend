/**
 * @file expo-push-token.adapter.ts
 * @module @stackra/notifications/native/adapters
 * @description Native Expo implementation of {@link IPushSubscriptionAdapter}.
 *
 *   `expo-notifications` is an **optional peer** — loaded lazily via
 *   `await import(/* @vite-ignore *\/ moduleName)` with a
 *   variable specifier so tsc doesn't statically require it and Vite
 *   doesn't try to pre-bundle it. When the peer isn't installed the
 *   adapter's methods resolve to `null` / `false` and the manager
 *   records the failure through analytics.
 */

import { Inject, Injectable, Optional } from "@stackra/container";

import type { IPushSubscriptionAdapter, IPushSubscriptionResult } from "@/core/interfaces";
import { EXPO_PUSH_CONFIG } from "../constants";
import type { IExpoPushConfig, INativePushToken } from "../interfaces";

/**
 * Minimal subset of `expo-notifications`'s public API — decoupled
 * from the real types because the package is an optional peer.
 */
interface IExpoNotificationsModule {
  getExpoPushTokenAsync(options?: {
    projectId?: string;
    experienceId?: string;
    applicationId?: string;
  }): Promise<{ data: string; type?: string }>;
  getPermissionsAsync?(): Promise<{ status: string; granted?: boolean }>;
  requestPermissionsAsync?(): Promise<{ status: string; granted?: boolean }>;
}

/**
 * Default lazy-loader for the optional peer.
 *
 * Uses a variable module specifier so tsc's static analysis (and
 * Vite's dep-pre-bundling) don't try to resolve
 * `expo-notifications` when the peer is absent.
 */
async function loadExpoNotifications(): Promise<IExpoNotificationsModule | null> {
  try {
    const moduleName = "expo-notifications";
    const mod = (await import(/* @vite-ignore */ moduleName)) as
      { default?: IExpoNotificationsModule } | IExpoNotificationsModule;
    return "default" in mod && mod.default ? mod.default : (mod as IExpoNotificationsModule);
  } catch {
    // Peer not available (running outside Expo) — return null so the
    // caller can early-out.
    return null;
  }
}

/**
 * Map an Expo permission status string to a `NotificationPermission`.
 */
function mapExpoStatus(status: string, granted?: boolean): NotificationPermission {
  if (granted === true) return "granted";
  if (granted === false) return "denied";
  switch (status) {
    case "granted":
      return "granted";
    case "denied":
      return "denied";
    default:
      return "default";
  }
}

/**
 * Native Expo push adapter — implements
 * {@link IPushSubscriptionAdapter}. Wraps `expo-notifications` so
 * the shared {@link PushSubscriptionManager} in the core subpath
 * works uniformly on native.
 */
@Injectable()
export class ExpoPushTokenAdapter implements IPushSubscriptionAdapter {
  /** Discriminator narrowed by {@link IPushSubscriptionResult}. */
  public readonly platform = "native" as const;

  /**
   * Test hook — override the module loader with a mock. Set to
   * `null` to fall back to the real `expo-notifications` import.
   */
  public loader: (() => Promise<IExpoNotificationsModule | null>) | null = null;

  /** Cached last-obtained token — powers `getSubscription`. */
  private cached: INativePushToken | null = null;

  public constructor(
    @Optional() @Inject(EXPO_PUSH_CONFIG) private readonly config?: IExpoPushConfig,
  ) {}

  // ── Reads ────────────────────────────────────────────────────────

  /**
   * Whether the current environment MIGHT support native push. A
   * definitive answer is only available once `subscribe()` actually
   * loads the peer — Metro can defer the resolution, so this method
   * is deliberately optimistic.
   */
  public isSupported(): boolean {
    return typeof globalThis !== "undefined";
  }

  /**
   * Current permission state. Returns `'denied'` when the peer is
   * unavailable so callers can early-out on a single check.
   */
  public async getPermissionState(): Promise<NotificationPermission> {
    const notifications = await this.load();
    if (!notifications?.getPermissionsAsync) return "denied";
    try {
      const result = await notifications.getPermissionsAsync();
      return mapExpoStatus(result.status, result.granted);
    } catch {
      // fail-soft — Metro can throw during a stale module load.
      return "denied";
    }
  }

  /**
   * Read the cached subscription. Returns `null` when no
   * `subscribe(...)` call has succeeded yet — Expo doesn't expose
   * a "read token without registering" API.
   */
  public async getSubscription(): Promise<IPushSubscriptionResult | null> {
    return this.cached ? { kind: "native", value: this.cached } : null;
  }

  // ── Mutations ────────────────────────────────────────────────────

  /**
   * Request permission (when needed) and retrieve the current Expo
   * push token.
   *
   * @param config - Optional per-call config override. When the
   *   caller supplies an `IExpoPushConfig`-shaped object it wins;
   *   otherwise the module-level config is used.
   */
  public async subscribe(config?: unknown): Promise<IPushSubscriptionResult> {
    const notifications = await this.load();
    if (!notifications) {
      throw new Error(
        "`expo-notifications` is not installed — install the peer to use native push.",
      );
    }

    // Best-effort permission request — Expo will silently return
    // the existing state if the user already granted / denied.
    if (notifications.requestPermissionsAsync) {
      try {
        const status = await notifications.requestPermissionsAsync();
        if (status.granted === false || (status.status === "denied" && status.granted !== true)) {
          throw new Error("Notification permission denied.");
        }
      } catch (err) {
        // Non-permission failures (Metro race, missing native
        // module) propagate — the manager translates them into the
        // canonical `NATIVE_PUSH_TOKEN_FAILED` analytics event.
        if (err instanceof Error && err.message === "Notification permission denied.") {
          throw err;
        }
      }
    }

    // Per-call config narrows to a shape with the same fields as the
    // module-level config; anything else falls back to the config
    // injected at construction time.
    const perCall = (config ?? undefined) as IExpoPushConfig | undefined;
    const merged: IExpoPushConfig = {
      ...(this.config ?? {}),
      ...(perCall ?? {}),
    };

    const response = await notifications.getExpoPushTokenAsync({
      ...(merged.projectId ? { projectId: merged.projectId } : {}),
      ...(merged.experienceId ? { experienceId: merged.experienceId } : {}),
      ...(merged.applicationId ? { applicationId: merged.applicationId } : {}),
    });
    const token: INativePushToken = {
      // Expo's runtime knows the platform through `Platform.OS`; we
      // don't have a hard reference here and stamping either 'ios'
      // or 'android' matters less than shipping the token itself.
      // The manager's dispatcher can override this from
      // `Platform.OS` at the callsite if precision matters.
      platform: "ios",
      token: response.data,
    };
    this.cached = token;
    return { kind: "native", value: token };
  }

  /**
   * Clear the cached token. Expo doesn't ship a "revoke" API — the
   * caller's backend is responsible for dropping the token from its
   * own store on `unsubscribe()`.
   */
  public async unsubscribe(): Promise<boolean> {
    const had = this.cached != null;
    this.cached = null;
    return had;
  }

  // ── Private ──────────────────────────────────────────────────────

  /**
   * Lazy-load the optional peer through the test-swappable loader.
   */
  private load(): Promise<IExpoNotificationsModule | null> {
    return (this.loader ?? loadExpoNotifications)();
  }
}
