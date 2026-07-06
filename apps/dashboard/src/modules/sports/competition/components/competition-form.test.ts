/**
 * @file competition-form.test.ts
 * @module modules/sports/competition/components/competition-form.test
 *
 * @description
 * Unit tests for the pure {@link toCompetitionPayload} builder: trimming of
 * `name`/`sport_key`, pass-through of `format` and `status`, the empty
 * `season_id` -> `null` mapping, and injection of `organization_id` /
 * `branch_id` from the active scope (with the empty-string fallback when the
 * scope ids are `null`).
 */

import { describe, expect, it } from "vitest";

import type { ActiveScope } from "@/lib/scope";
import type { CompetitionFormValues } from "@/modules/sports/competition/components/competition-form";

import { toCompetitionPayload } from "@/modules/sports/competition/components/competition-form";

const baseValues: CompetitionFormValues = {
  name: "  U12 Regional League  ",
  sport_key: "  football  ",
  format: "league",
  status: "upcoming",
  season_id: "",
};

const scope: ActiveScope = { organizationId: "org-2", branchId: "br-3", seasonId: "sea-1" };

describe("toCompetitionPayload", () => {
  it("trims the name and sport_key", () => {
    const payload = toCompetitionPayload(baseValues, scope);

    expect(payload.name).toBe("U12 Regional League");
    expect(payload.sport_key).toBe("football");
  });

  it("passes format and status through unchanged", () => {
    const payload = toCompetitionPayload(
      { ...baseValues, format: "knockout", status: "active" },
      scope,
    );

    expect(payload.format).toBe("knockout");
    expect(payload.status).toBe("active");
  });

  it("maps an empty season_id to null and keeps a set one", () => {
    expect(toCompetitionPayload(baseValues, scope).season_id).toBeNull();
    expect(toCompetitionPayload({ ...baseValues, season_id: "sea-9" }, scope).season_id).toBe(
      "sea-9",
    );
  });

  it("injects organization_id and branch_id from the active scope", () => {
    const payload = toCompetitionPayload(baseValues, scope);

    expect(payload.organization_id).toBe("org-2");
    expect(payload.branch_id).toBe("br-3");
  });

  it("falls back to empty strings when the scope ids are null", () => {
    const payload = toCompetitionPayload(baseValues, {
      organizationId: null,
      branchId: null,
      seasonId: null,
    });

    expect(payload.organization_id).toBe("");
    expect(payload.branch_id).toBe("");
  });
});
