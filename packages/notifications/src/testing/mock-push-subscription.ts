/**
 * @file mock-push-subscription.ts
 * @module @stackra/notifications/testing
 * @description In-memory `PushSubscription`-like fake for tests.
 *
 *   Exercises the `endpoint` / `keys` / `unsubscribe` / `toJSON`
 *   surface `PushSubscriptionManager` reads. Every field defaults
 *   to a plausible value; overrides customise per-test shape.
 */

import type { IWebPushSubscription } from '@/push/interfaces';

/**
 * Options accepted by {@link MockPushSubscription}.
 */
export interface IMockPushSubscriptionOptions {
  /** Endpoint URL. */
  readonly endpoint?: string;
  /** Base64-encoded p256dh key. */
  readonly p256dh?: string;
  /** Base64-encoded auth secret. */
  readonly auth?: string;
  /** Expiration timestamp; `null` when the subscription never expires. */
  readonly expirationTime?: number | null;
  /** Whether `unsubscribe()` resolves to `true`. */
  readonly unsubscribeResult?: boolean;
}

/**
 * A `PushSubscription`-shaped fake for tests.
 *
 * Consumers construct one and register it with
 * {@link MockPushSubscriptionManager} via
 * `simulateSubscription(subscription)`.
 */
export class MockPushSubscription {
  public readonly endpoint: string;
  public readonly expirationTime: number | null;
  public unsubscribeCalls = 0;

  private readonly p256dh: string;
  private readonly auth: string;
  private readonly unsubscribeResult: boolean;

  public constructor(options: IMockPushSubscriptionOptions = {}) {
    this.endpoint = options.endpoint ?? 'https://push.example.com/subs/test-endpoint';
    this.p256dh = options.p256dh ?? 'p256dh-key-base64';
    this.auth = options.auth ?? 'auth-secret-base64';
    this.expirationTime = options.expirationTime ?? null;
    this.unsubscribeResult = options.unsubscribeResult ?? true;
  }

  /**
   * Mirrors `PushSubscription.getKey` — returns an
   * `ArrayBuffer` of the requested key. Both `p256dh` and `auth`
   * are stored as already-base64-encoded strings for simplicity;
   * `getKey` re-encodes them as raw bytes so the surrounding
   * `arrayBufferToBase64` helper decodes them the same way as the
   * real API.
   */
  public getKey(name: 'p256dh' | 'auth'): ArrayBuffer {
    const raw = name === 'p256dh' ? this.p256dh : this.auth;
    const bytes = new Uint8Array(raw.length);
    for (let i = 0; i < raw.length; i += 1) bytes[i] = raw.charCodeAt(i);
    return bytes.buffer as ArrayBuffer;
  }

  /** Track call count + honour the configured result. */
  public async unsubscribe(): Promise<boolean> {
    this.unsubscribeCalls += 1;
    return this.unsubscribeResult;
  }

  /**
   * Wire-friendly snapshot mirroring the real API. Tests rarely
   * need this — the manager returns its own {@link IWebPushSubscription}
   * shape — but the parity keeps this class a drop-in for consumers
   * that pass a `PushSubscription` around directly.
   */
  public toJSON(): IWebPushSubscription {
    return {
      endpoint: this.endpoint,
      expirationTime: this.expirationTime,
      keys: { p256dh: this.p256dh, auth: this.auth },
    };
  }
}
