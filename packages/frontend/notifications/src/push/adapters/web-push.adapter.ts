/**
 * @file web-push.adapter.ts
 * @module @stackra/notifications/push/adapters
 * @description Web Push implementation of {@link IPushSubscriptionAdapter}.
 *
 *   Wraps `navigator.serviceWorker.getRegistration(scope).pushManager`
 *   behind the platform-agnostic contract so the core
 *   {@link PushSubscriptionManager} can invoke a single API across
 *   web + native.
 *
 *   SSR-safe: every DOM / navigator probe is guarded on
 *   `typeof navigator === 'undefined'` and swallows browser-specific
 *   throws (private mode, no service worker) as `null` / `false`.
 */

import { Inject, Injectable } from "@stackra/container";

import { InvalidVapidKeyError, PushNotSupportedError } from "@/core/errors";
import type { IPushSubscriptionAdapter, IPushSubscriptionResult } from "@/core/interfaces";
import { WEB_PUSH_CONFIG } from "../constants";
import type { IWebPushConfig, IWebPushSubscription } from "../interfaces";
import { urlB64ToUint8Array } from "../utils";

/**
 * Base64-encode an `ArrayBuffer` for wire transport.
 *
 * `PushSubscription.getKey('p256dh' | 'auth')` returns an
 * `ArrayBuffer` that a POST payload can't carry as-is; base64
 * lets the app send it verbatim to its backend.
 */
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.length; i += 1) {
    binary += String.fromCharCode(bytes[i] as number);
  }
  // `btoa` is universally available in browsers + jsdom.
  return typeof btoa === "function" ? btoa(binary) : "";
}

/**
 * Serialise a native `PushSubscription` into the wire-friendly
 * {@link IWebPushSubscription} shape.
 */
function serialise(subscription: PushSubscription): IWebPushSubscription {
  const p256dh = subscription.getKey("p256dh");
  const auth = subscription.getKey("auth");
  return {
    endpoint: subscription.endpoint,
    expirationTime: subscription.expirationTime,
    keys: {
      p256dh: p256dh ? arrayBufferToBase64(p256dh) : "",
      auth: auth ? arrayBufferToBase64(auth) : "",
    },
  };
}

/**
 * Web Push adapter — implements {@link IPushSubscriptionAdapter} on
 * top of the browser's `PushManager` API.
 *
 * @example
 * ```typescript
 * // Wired automatically by `PushModule.forRoot(...)`; consumers
 * // never instantiate this directly.
 * const adapter = app.get(PUSH_SUBSCRIPTION_ADAPTER);
 * if (adapter.platform === 'web') { … }
 * ```
 */
@Injectable()
export class WebPushAdapter implements IPushSubscriptionAdapter {
  /** Discriminator narrowed by {@link IPushSubscriptionResult}. */
  public readonly platform = "web" as const;

  public constructor(@Inject(WEB_PUSH_CONFIG) private readonly config: IWebPushConfig) {}

  // ── Reads ────────────────────────────────────────────────────────

  /**
   * Whether the current environment supports Web Push. Fails soft on
   * SSR (`typeof navigator === 'undefined'`) and in browsers without
   * `Notification` / `PushManager` / `serviceWorker`.
   */
  public isSupported(): boolean {
    if (typeof navigator === "undefined") return false;
    return (
      "serviceWorker" in navigator &&
      "PushManager" in globalThis &&
      typeof Notification !== "undefined"
    );
  }

  /**
   * Current permission state. Returns `'denied'` on unsupported
   * environments so callers can early-out on a single check.
   */
  public async getPermissionState(): Promise<NotificationPermission> {
    if (!this.isSupported()) return "denied";
    return Notification.permission;
  }

  /**
   * Read the current subscription, if any. Returns `null` when the
   * user has never subscribed or when the environment is
   * unsupported.
   */
  public async getSubscription(): Promise<IPushSubscriptionResult | null> {
    if (!this.isSupported()) return null;
    try {
      const registration = await this.registration();
      if (!registration) return null;
      const sub = await registration.pushManager.getSubscription();
      return sub ? { kind: "web", value: serialise(sub) } : null;
    } catch {
      // fail-soft — a race between page load and SW registration
      // can throw; caller can retry after `serviceWorker.ready`.
      return null;
    }
  }

  // ── Mutations ────────────────────────────────────────────────────

  /**
   * Subscribe the user to push notifications.
   *
   * @param config - Optional override string carrying a VAPID public
   *   key. When omitted the module-level key is used.
   * @throws {@link PushNotSupportedError} when the environment
   *   doesn't support Web Push.
   * @throws {@link InvalidVapidKeyError} when the resolved VAPID
   *   key is empty or malformed.
   */
  public async subscribe(config?: unknown): Promise<IPushSubscriptionResult> {
    if (!this.isSupported()) {
      throw new PushNotSupportedError("Push is not supported in this browser.");
    }

    // The caller may pass a string override (per-call VAPID key) —
    // any other shape falls back to the module-level config.
    const perCallKey = typeof config === "string" ? config : undefined;
    const resolvedKey = perCallKey ?? this.config.vapidPublicKey;
    if (typeof resolvedKey !== "string" || resolvedKey.length === 0) {
      throw new InvalidVapidKeyError(resolvedKey);
    }

    const registration = await this.registration();
    if (!registration) {
      throw new PushNotSupportedError("No service-worker registration for the configured scope.");
    }

    // Reuse an existing subscription if one is present — subscribing
    // a second time throws on Chromium.
    const existing = await registration.pushManager.getSubscription();
    if (existing) {
      return { kind: "web", value: serialise(existing) };
    }

    const applicationServerKey = urlB64ToUint8Array(resolvedKey);
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: this.config.userVisibleOnly,
      // `PushManager.subscribe` accepts `BufferSource | string` here;
      // the generic `Uint8Array<ArrayBufferLike>` from tsc 6.x
      // doesn't structurally satisfy the ArrayBuffer-narrowed field
      // without an explicit widen. Cast at the boundary.
      applicationServerKey: applicationServerKey as unknown as BufferSource,
    });
    return { kind: "web", value: serialise(subscription) };
  }

  /**
   * Unsubscribe from push notifications.
   *
   * @returns `true` when the subscription was cancelled; `false`
   *   when there was no active subscription.
   */
  public async unsubscribe(): Promise<boolean> {
    if (!this.isSupported()) return false;
    const registration = await this.registration();
    if (!registration) return false;
    const existing = await registration.pushManager.getSubscription();
    if (!existing) return false;
    return existing.unsubscribe();
  }

  // ── Private ──────────────────────────────────────────────────────

  /**
   * Resolve the service-worker registration for the configured
   * scope. Fail-soft — returns `null` when no registration is
   * present.
   */
  private async registration(): Promise<ServiceWorkerRegistration | null> {
    if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return null;
    try {
      const reg = await navigator.serviceWorker.getRegistration(this.config.serviceWorkerScope);
      return reg ?? null;
    } catch {
      // fail-soft — a browser without SW support (private mode)
      // throws here.
      return null;
    }
  }
}
