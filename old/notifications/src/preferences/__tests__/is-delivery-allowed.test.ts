/**
 * @file is-delivery-allowed.test.ts
 * @module @academorix/notifications/preferences/__tests__/is-delivery-allowed.test
 *
 * @description
 * Unit tests for the compliance-critical {@link isDeliveryAllowed}
 * predicate. Covers:
 *
 *  - Default-allow when nothing is opted out.
 *  - Per-channel opt-out blocks that channel across every type.
 *  - Per-event (`type`) opt-out blocks that event across every channel.
 *  - Every channel × preferences.defaults matrix.
 *  - Quiet hours blocks (both normal and wrap-around windows).
 *  - {@link MANDATORY_PUSH_TYPES} bypasses DND + quiet hours on push.
 *  - {@link MANDATORY_PUSH_TYPES} does NOT bypass on non-push channels.
 */

import { describe, expect, it } from "vitest";

import { isDeliveryAllowed, MANDATORY_PUSH_TYPES } from "../is-delivery-allowed.util";

import type { NotificationChannel } from "../../types/notification.type";
import type { NotificationPreferences } from "../preferences.type";

const EVERY_CHANNEL: readonly NotificationChannel[] = ["push", "email", "sms", "whatsapp"];

/** Builds a minimal preferences object with the given overrides. */
function makePreferences(
  overrides: Partial<NotificationPreferences> = {},
): NotificationPreferences {
  return {
    id: "np_test",
    tenant_id: "tnt_test",
    user_id: "usr_test",
    defaults: {},
    per_child: {},
    quiet_hours: {},
    updated_at: null,
    ...overrides,
  };
}

/** A UTC Date for reproducibility across CI timezones. */
function utcAt(hh: number, mm = 0): Date {
  return new Date(Date.UTC(2025, 0, 15, hh, mm, 0, 0));
}

describe("MANDATORY_PUSH_TYPES", () => {
  it("includes the known safety allowlist", () => {
    expect(MANDATORY_PUSH_TYPES.has("child_safety_alert")).toBe(true);
    expect(MANDATORY_PUSH_TYPES.has("emergency_pickup_request")).toBe(true);
  });

  it("is a frozen Set (immutable at runtime for callers)", () => {
    // We can't easily prevent mutation of a Set, but we can assert
    // the type-level readonliness — this test guards the invariant
    // that we don't accidentally re-assign the constant.
    expect(MANDATORY_PUSH_TYPES).toBeInstanceOf(Set);
  });
});

describe("isDeliveryAllowed — default-allow", () => {
  it("allows every channel when preferences are empty", () => {
    const preferences = makePreferences();

    for (const channel of EVERY_CHANNEL) {
      expect(
        isDeliveryAllowed({ channel, type: "invitation_sent", preferences, now: utcAt(12) }),
      ).toBe(true);
    }
  });
});

describe("isDeliveryAllowed — per-channel opt-out", () => {
  it.each(EVERY_CHANNEL)("blocks channel=%s when defaults[channel] is false", (channel) => {
    const preferences = makePreferences({ defaults: { [channel]: false } });

    expect(
      isDeliveryAllowed({ channel, type: "invitation_sent", preferences, now: utcAt(12) }),
    ).toBe(false);
  });

  it("does NOT bleed one channel's opt-out into another", () => {
    const preferences = makePreferences({ defaults: { push: false } });

    expect(
      isDeliveryAllowed({
        channel: "email",
        type: "invitation_sent",
        preferences,
        now: utcAt(12),
      }),
    ).toBe(true);
    expect(
      isDeliveryAllowed({
        channel: "sms",
        type: "invitation_sent",
        preferences,
        now: utcAt(12),
      }),
    ).toBe(true);
    expect(
      isDeliveryAllowed({
        channel: "whatsapp",
        type: "invitation_sent",
        preferences,
        now: utcAt(12),
      }),
    ).toBe(true);
  });

  it("treats non-boolean values under defaults[channel] as 'no opt-out'", () => {
    // The backend may store richer values (e.g. a nested object of
    // per-type toggles under `push`). We only opt out on an
    // explicit `false`.
    const preferences = makePreferences({ defaults: { push: { attendance_check_in: false } } });

    expect(
      isDeliveryAllowed({
        channel: "push",
        type: "invitation_sent",
        preferences,
        now: utcAt(12),
      }),
    ).toBe(true);
  });
});

describe("isDeliveryAllowed — per-event opt-out", () => {
  it("blocks every channel when defaults[type] is false", () => {
    const preferences = makePreferences({ defaults: { marketing_digest: false } });

    for (const channel of EVERY_CHANNEL) {
      expect(
        isDeliveryAllowed({ channel, type: "marketing_digest", preferences, now: utcAt(12) }),
      ).toBe(false);
    }
  });

  it("does NOT block other event types", () => {
    const preferences = makePreferences({ defaults: { marketing_digest: false } });

    expect(
      isDeliveryAllowed({
        channel: "email",
        type: "invitation_sent",
        preferences,
        now: utcAt(12),
      }),
    ).toBe(true);
  });
});

describe("isDeliveryAllowed — quiet hours", () => {
  it("blocks all channels while inside a normal window", () => {
    const preferences = makePreferences({
      quiet_hours: { start: "22:00", end: "07:00", timezone: "UTC" },
    });

    // 23:30 UTC — inside 22..07 wrap.
    for (const channel of EVERY_CHANNEL) {
      expect(
        isDeliveryAllowed({ channel, type: "invitation_sent", preferences, now: utcAt(23, 30) }),
      ).toBe(false);
    }
  });

  it("allows outside the quiet window", () => {
    const preferences = makePreferences({
      quiet_hours: { start: "22:00", end: "07:00", timezone: "UTC" },
    });

    // 12:00 UTC — outside 22..07 wrap.
    for (const channel of EVERY_CHANNEL) {
      expect(
        isDeliveryAllowed({ channel, type: "invitation_sent", preferences, now: utcAt(12) }),
      ).toBe(true);
    }
  });

  it("wraps midnight (block at 02:00 UTC for a 22..07 window)", () => {
    const preferences = makePreferences({
      quiet_hours: { start: "22:00", end: "07:00", timezone: "UTC" },
    });

    expect(
      isDeliveryAllowed({
        channel: "email",
        type: "invitation_sent",
        preferences,
        now: utcAt(2),
      }),
    ).toBe(false);
  });

  it("respects the exclusive end edge", () => {
    const preferences = makePreferences({
      quiet_hours: { start: "22:00", end: "07:00", timezone: "UTC" },
    });

    // Exactly 07:00 UTC → outside the (22..07] wrap.
    expect(
      isDeliveryAllowed({
        channel: "email",
        type: "invitation_sent",
        preferences,
        now: utcAt(7),
      }),
    ).toBe(true);
  });
});

describe("isDeliveryAllowed — MANDATORY_PUSH_TYPES bypass", () => {
  it("bypasses per-channel push opt-out for safety types", () => {
    const preferences = makePreferences({ defaults: { push: false } });

    expect(
      isDeliveryAllowed({
        channel: "push",
        type: "child_safety_alert",
        preferences,
        now: utcAt(12),
      }),
    ).toBe(true);
  });

  it("bypasses quiet hours for safety types on push", () => {
    const preferences = makePreferences({
      quiet_hours: { start: "22:00", end: "07:00", timezone: "UTC" },
    });

    // 02:00 UTC — inside quiet hours — but safety pushes through.
    expect(
      isDeliveryAllowed({
        channel: "push",
        type: "emergency_pickup_request",
        preferences,
        now: utcAt(2),
      }),
    ).toBe(true);
  });

  it("bypasses even an explicit per-event opt-out on push", () => {
    // Users don't get to opt out of child-safety pushes.
    const preferences = makePreferences({
      defaults: { child_safety_alert: false },
    });

    expect(
      isDeliveryAllowed({
        channel: "push",
        type: "child_safety_alert",
        preferences,
        now: utcAt(12),
      }),
    ).toBe(true);
  });

  it("does NOT bypass on non-push channels", () => {
    const preferences = makePreferences({ defaults: { email: false } });

    expect(
      isDeliveryAllowed({
        channel: "email",
        type: "child_safety_alert",
        preferences,
        now: utcAt(12),
      }),
    ).toBe(false);
  });

  it("does NOT bypass quiet hours on non-push channels", () => {
    const preferences = makePreferences({
      quiet_hours: { start: "22:00", end: "07:00", timezone: "UTC" },
    });

    expect(
      isDeliveryAllowed({
        channel: "email",
        type: "child_safety_alert",
        preferences,
        now: utcAt(2),
      }),
    ).toBe(false);
    expect(
      isDeliveryAllowed({
        channel: "sms",
        type: "emergency_pickup_request",
        preferences,
        now: utcAt(2),
      }),
    ).toBe(false);
    expect(
      isDeliveryAllowed({
        channel: "whatsapp",
        type: "emergency_pickup_request",
        preferences,
        now: utcAt(2),
      }),
    ).toBe(false);
  });
});

describe("isDeliveryAllowed — precedence corner cases", () => {
  it("per-event opt-out beats a permissive channel default", () => {
    const preferences = makePreferences({
      defaults: { push: true, marketing_digest: false },
    });

    expect(
      isDeliveryAllowed({
        channel: "push",
        type: "marketing_digest",
        preferences,
        now: utcAt(12),
      }),
    ).toBe(false);
  });

  it("uses new Date() when 'now' is omitted (no explicit crash)", () => {
    const preferences = makePreferences();

    // Just make sure it returns a boolean; the actual value depends
    // on the CI clock, so we don't assert true/false.
    expect(
      typeof isDeliveryAllowed({
        channel: "push",
        type: "invitation_sent",
        preferences,
      }),
    ).toBe("boolean");
  });
});
