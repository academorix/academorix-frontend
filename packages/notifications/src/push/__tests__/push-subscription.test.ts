/**
 * @file push-subscription.test.ts
 * @module @academorix/notifications/push/__tests__/push-subscription.test
 *
 * @description
 * Unit tests for the Web Push subscription helpers.
 *
 * Covers:
 *
 *  - {@link urlBase64ToUint8Array} — happy path + padding + already-
 *    padded input + edge lengths.
 *  - {@link serializePushSubscription} — throws on missing keys +
 *    correct base64 on the happy path.
 *  - {@link isPushSupported} — false in Node-only, true when the
 *    relevant globals are present.
 */

import { afterEach, describe, expect, it, vi } from "vitest";

import { isPushSupported, serializePushSubscription } from "../push-subscription.util";
import { urlBase64ToUint8Array } from "../vapid.util";

/**
 * Converts a `Uint8Array` into a plain array of numbers. Vitest +
 * strict TS refuse to spread a `Uint8Array` into
 * `String.fromCharCode` directly (`Array.from` widens to `unknown[]`
 * in this lib target).
 */
function bytesToArray(bytes: Uint8Array): number[] {
  const out: number[] = [];

  for (let i = 0; i < bytes.length; i += 1) {
    out.push(bytes[i] ?? 0);
  }

  return out;
}

/** Utility so the tests can compare a decoded byte array to a string. */
function bytesToAsciiString(bytes: Uint8Array): string {
  return String.fromCharCode(...bytesToArray(bytes));
}

/**
 * Builds a minimal `PushSubscription`-shaped mock. Only the fields
 * used by {@link serializePushSubscription} are populated.
 */
function makeSubscriptionMock(overrides: {
  endpoint?: string;
  expirationTime?: number | null;
  p256dh?: ArrayBuffer | null;
  auth?: ArrayBuffer | null;
}): PushSubscription {
  const {
    endpoint = "https://push.example/endpoint",
    expirationTime = null,
    p256dh = new Uint8Array([1, 2, 3, 4]).buffer,
    auth = new Uint8Array([10, 20, 30]).buffer,
  } = overrides;

  return {
    endpoint,
    expirationTime,
    options: {} as PushSubscriptionOptions,
    getKey: (name: PushEncryptionKeyName) => {
      if (name === "p256dh") return p256dh;

      if (name === "auth") return auth;

      return null;
    },
    toJSON: () => ({}) as PushSubscriptionJSON,
    unsubscribe: () => Promise.resolve(true),
  } as unknown as PushSubscription;
}

describe("urlBase64ToUint8Array", () => {
  it("decodes a base64-url string with '-' and '_' substitutions", () => {
    // base64 for [0x14, 0xfb, 0x9c, 0x03, 0xd9, 0x7e] is "FPucA9l+",
    // base64-url is "FPucA9l-".
    const bytes = urlBase64ToUint8Array("FPucA9l-");

    expect(bytesToArray(bytes)).toEqual([0x14, 0xfb, 0x9c, 0x03, 0xd9, 0x7e]);
  });

  it("pads an unpadded input to a multiple of 4", () => {
    // base64 "aGk=" → "hi". Unpadded input "aGk" (length 3) should
    // add one '=' and decode to the same bytes.
    const bytes = urlBase64ToUint8Array("aGk");

    expect(bytesToAsciiString(bytes)).toBe("hi");
  });

  it("passes through already-padded input unchanged", () => {
    // Length-4 input needs no padding; the '(4 - (4 % 4)) % 4' term
    // must resolve to 0 so we don't stuff extra '=' onto a valid
    // string.
    const bytes = urlBase64ToUint8Array("aGk=");

    expect(bytesToAsciiString(bytes)).toBe("hi");
  });

  it("returns an empty array for an empty string", () => {
    const bytes = urlBase64ToUint8Array("");

    expect(bytes.length).toBe(0);
  });

  it("handles the underscore substitution", () => {
    // base64 for [0xfb] is "+w==". base64-url is "-w==" (no
    // underscore in this example), so use a byte that maps through '/'
    // → '_': base64 for [0xfb, 0xff] is "+/8=", base64-url is
    // "-_8=". Confirm the '_' is remapped to '/'.
    const bytes = urlBase64ToUint8Array("-_8=");

    expect(bytesToArray(bytes)).toEqual([0xfb, 0xff]);
  });
});

describe("serializePushSubscription", () => {
  it("returns the wire envelope with base64-encoded keys", () => {
    // Uint8Array [1, 2, 3, 4] → base64 "AQIDBA=="
    // Uint8Array [10, 20, 30] → base64 "ChQe"
    const subscription = makeSubscriptionMock({});

    const serialized = serializePushSubscription(subscription);

    expect(serialized.endpoint).toBe("https://push.example/endpoint");
    expect(serialized.expirationTime).toBeNull();
    expect(serialized.keys.p256dh).toBe("AQIDBA==");
    expect(serialized.keys.auth).toBe("ChQe");
  });

  it("passes through a numeric expirationTime", () => {
    const subscription = makeSubscriptionMock({ expirationTime: 1_735_000_000_000 });

    expect(serializePushSubscription(subscription).expirationTime).toBe(1_735_000_000_000);
  });

  it("throws when p256dh is missing", () => {
    const subscription = makeSubscriptionMock({ p256dh: null });

    expect(() => serializePushSubscription(subscription)).toThrow(
      /missing required encryption keys/i,
    );
  });

  it("throws when auth is missing", () => {
    const subscription = makeSubscriptionMock({ auth: null });

    expect(() => serializePushSubscription(subscription)).toThrow(
      /missing required encryption keys/i,
    );
  });

  it("throws when both keys are missing", () => {
    const subscription = makeSubscriptionMock({ p256dh: null, auth: null });

    expect(() => serializePushSubscription(subscription)).toThrow(
      /missing required encryption keys/i,
    );
  });
});

describe("isPushSupported", () => {
  const originalPushManager = (globalThis as { PushManager?: unknown }).PushManager;
  const originalNotification = (globalThis as { Notification?: unknown }).Notification;

  afterEach(() => {
    // Restore whatever jsdom / the runtime originally exposed.
    if (originalPushManager === undefined) {
      delete (globalThis as { PushManager?: unknown }).PushManager;
    } else {
      (globalThis as { PushManager?: unknown }).PushManager = originalPushManager;
    }

    if (originalNotification === undefined) {
      delete (globalThis as { Notification?: unknown }).Notification;
    } else {
      (globalThis as { Notification?: unknown }).Notification = originalNotification;
    }

    vi.unstubAllGlobals();
  });

  it("returns false when PushManager is unavailable", () => {
    // Remove PushManager without touching the rest of the env.
    delete (globalThis as { PushManager?: unknown }).PushManager;

    expect(isPushSupported()).toBe(false);
  });

  it("returns false when Notification is unavailable", () => {
    // Stub PushManager but remove Notification.
    (globalThis as { PushManager?: unknown }).PushManager = class {};
    delete (globalThis as { Notification?: unknown }).Notification;

    expect(isPushSupported()).toBe(false);
  });

  it("returns true when all three globals are present", () => {
    (globalThis as { PushManager?: unknown }).PushManager = class {};
    (globalThis as { Notification?: unknown }).Notification = class {};
    // jsdom provides `navigator`, but `serviceWorker` isn't
    // installed by default — stub it in.
    vi.stubGlobal("navigator", {
      ...globalThis.navigator,
      serviceWorker: { register: vi.fn() },
    });

    expect(isPushSupported()).toBe(true);
  });
});
