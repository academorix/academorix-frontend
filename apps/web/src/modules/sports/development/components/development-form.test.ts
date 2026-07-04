/**
 * @file development-form.test.ts
 * @module modules/sports/development/components/development-form.test
 *
 * @description
 * Unit tests for the pure {@link toDevelopmentPayload} builder: trimming of
 * `sport_key` and `goal`, pass-through of `athlete_id` and `status`, the empty
 * `target_date` -> `null` mapping (and a set date preserved), and the empty
 * `note` -> `null` coercion.
 */

import { describe, expect, it } from "vitest";

import type { DevelopmentFormValues } from "@/modules/sports/development/components/development-form";

import { toDevelopmentPayload } from "@/modules/sports/development/components/development-form";

const baseValues: DevelopmentFormValues = {
  athlete_id: "ath-1",
  sport_key: "  football  ",
  goal: "  Improve weak-foot passing  ",
  status: "active",
  target_date: "",
  note: "",
};

describe("toDevelopmentPayload", () => {
  it("trims the sport_key and goal", () => {
    const payload = toDevelopmentPayload(baseValues);

    expect(payload.sport_key).toBe("football");
    expect(payload.goal).toBe("Improve weak-foot passing");
  });

  it("passes athlete_id and status through unchanged", () => {
    const payload = toDevelopmentPayload({ ...baseValues, status: "achieved" });

    expect(payload.athlete_id).toBe("ath-1");
    expect(payload.status).toBe("achieved");
  });

  it("maps an empty target_date to null and keeps a set one", () => {
    expect(toDevelopmentPayload(baseValues).target_date).toBeNull();
    expect(toDevelopmentPayload({ ...baseValues, target_date: "2025-06-01" }).target_date).toBe(
      "2025-06-01",
    );
  });

  it("maps an empty note to null and trims a present one", () => {
    expect(toDevelopmentPayload(baseValues).note).toBeNull();
    expect(toDevelopmentPayload({ ...baseValues, note: "  context  " }).note).toBe("context");
  });
});
