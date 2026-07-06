/**
 * @file drill-form.test.ts
 * @module modules/sports/drills/components/drill-form.test
 *
 * @description
 * Unit tests for the pure {@link toDrillPayload} builder: trimming of text
 * fields, splitting the comma-separated `tags` string into a trimmed `string[]`
 * (dropping blanks), numeric coercion of `duration_minutes` (defaulting invalid
 * input to `0`), and the empty -> `null` mapping for the optional media id.
 */

import { describe, expect, it } from "vitest";

import type { DrillFormValues } from "@/modules/sports/drills/components/drill-form";

import { toDrillPayload } from "@/modules/sports/drills/components/drill-form";

const baseValues: DrillFormValues = {
  name: "  4v1 Rondo  ",
  sport_key: "  football  ",
  description: "  Keep possession under pressure  ",
  tags: "passing, control ,  first-touch ,,",
  level: "beginner",
  duration_minutes: "15",
  media_document_id: "",
};

describe("toDrillPayload", () => {
  it("trims the name, sport_key, and description", () => {
    const payload = toDrillPayload(baseValues);

    expect(payload.name).toBe("4v1 Rondo");
    expect(payload.sport_key).toBe("football");
    expect(payload.description).toBe("Keep possession under pressure");
  });

  it("splits comma-separated tags into a trimmed string[] dropping blanks", () => {
    expect(toDrillPayload(baseValues).tags).toEqual(["passing", "control", "first-touch"]);
  });

  it("returns an empty tags array when the input is blank", () => {
    expect(toDrillPayload({ ...baseValues, tags: "   " }).tags).toEqual([]);
  });

  it("coerces duration_minutes to a number", () => {
    const payload = toDrillPayload(baseValues);

    expect(payload.duration_minutes).toBe(15);
    expect(typeof payload.duration_minutes).toBe("number");
  });

  it("defaults empty or non-numeric duration to 0", () => {
    expect(toDrillPayload({ ...baseValues, duration_minutes: "" }).duration_minutes).toBe(0);
    expect(toDrillPayload({ ...baseValues, duration_minutes: "abc" }).duration_minutes).toBe(0);
  });

  it("maps an empty media id to null and trims a present one", () => {
    expect(toDrillPayload({ ...baseValues, media_document_id: "" }).media_document_id).toBeNull();
    expect(
      toDrillPayload({ ...baseValues, media_document_id: "  doc-1  " }).media_document_id,
    ).toBe("doc-1");
  });
});
