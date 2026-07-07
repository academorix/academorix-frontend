/**
 * @file facility-form.test.ts
 * @module modules/facilities/__tests__/facility-form.test
 *
 * @description
 * Unit tests for the two pure exports of the facility form module:
 *
 *   1. {@link validateFacilityForm} — surfaces required-field errors for
 *      `name`, `branch_id`, and `type`, plus the "positive integer" check on
 *      `capacity` when the user does type something.
 *
 *   2. {@link toFacilityPayload} — trims strings, coerces the "major-unit"
 *      hourly cost into the wire-format minor unit, defaults the currency to
 *      `USD`, maps empty nullable fields to `null`, and falls back to the
 *      active scope's `branchId` when the form leaves the branch blank.
 */

import { describe, expect, it } from "vitest";

import type { ActiveScope } from "@/lib/scope";
import type { FacilityFormValues } from "@/modules/facilities/components/facility-form";

import {
  toFacilityPayload,
  validateFacilityForm,
} from "@/modules/facilities/components/facility-form";

/**
 * A helper that returns a fully-populated valid form-values object; each
 * test overrides just the fields it cares about via a spread.
 */
function baseValues(overrides: Partial<FacilityFormValues> = {}): FacilityFormValues {
  return {
    name: "Main Pitch",
    branch_id: "brn_river",
    type: "pitch",
    capacity: "22",
    unit_of_capacity: "players",
    indoor: false,
    is_active: true,
    currency: "USD",
    hourly_cost: "30.00",
    notes: "",
    ...overrides,
  };
}

/** An `ActiveScope` fixture the tests can inject where the payload builder needs one. */
const scope: ActiveScope = { organizationId: "org-1", branchId: "brn_river", seasonId: null };

describe("validateFacilityForm", () => {
  it("returns no errors for a fully populated form", () => {
    expect(validateFacilityForm(baseValues())).toEqual({});
  });

  it("flags an empty name", () => {
    const errors = validateFacilityForm(baseValues({ name: "" }));

    expect(errors.name).toMatch(/required/i);
  });

  it("flags a name that is only whitespace", () => {
    const errors = validateFacilityForm(baseValues({ name: "   " }));

    expect(errors.name).toMatch(/required/i);
  });

  it("flags a missing branch id", () => {
    const errors = validateFacilityForm(baseValues({ branch_id: "" }));

    expect(errors.branch_id).toMatch(/required/i);
  });

  it("flags a missing type", () => {
    // Cast through unknown to bypass the strict-union type-guard — the form
    // itself is not statically constrained at the UI layer (the Select
    // returns `Key | null`).
    const errors = validateFacilityForm(
      baseValues({ type: "" as unknown as FacilityFormValues["type"] }),
    );

    expect(errors.type).toMatch(/required/i);
  });

  it("flags a negative capacity", () => {
    const errors = validateFacilityForm(baseValues({ capacity: "-1" }));

    expect(errors.capacity).toMatch(/positive/i);
  });

  it("does not flag an empty capacity (parsed to 0 downstream)", () => {
    expect(validateFacilityForm(baseValues({ capacity: "" })).capacity).toBeUndefined();
  });
});

describe("toFacilityPayload", () => {
  it("trims the name", () => {
    const payload = toFacilityPayload(baseValues({ name: "  Main Pitch  " }), scope);

    expect(payload.name).toBe("Main Pitch");
  });

  it("converts hourly cost from major to minor units", () => {
    // 30.00 USD → 3000 minor units (cents). Round-tripping through
    // `Number.parseFloat` + `Math.round` guards against fp precision drift.
    const payload = toFacilityPayload(baseValues({ hourly_cost: "30.00" }), scope);

    expect(payload.hourly_cost_minor).toBe(3000);
  });

  it("collapses unparseable hourly cost to 0", () => {
    const payload = toFacilityPayload(baseValues({ hourly_cost: "abc" }), scope);

    expect(payload.hourly_cost_minor).toBe(0);
  });

  it("defaults an empty currency to USD and uppercases what the user types", () => {
    expect(toFacilityPayload(baseValues({ currency: "" }), scope).currency).toBe("USD");
    expect(toFacilityPayload(baseValues({ currency: "eur" }), scope).currency).toBe("EUR");
  });

  it("maps empty nullable fields to null", () => {
    const payload = toFacilityPayload(
      baseValues({ notes: "", unit_of_capacity: "" }),
      scope,
    );

    expect(payload.notes).toBeNull();
    expect(payload.unit_of_capacity).toBeNull();
  });

  it("preserves non-empty nullable fields", () => {
    const payload = toFacilityPayload(
      baseValues({ notes: "Weekend deep-clean at 6am", unit_of_capacity: "players" }),
      scope,
    );

    expect(payload.notes).toBe("Weekend deep-clean at 6am");
    expect(payload.unit_of_capacity).toBe("players");
  });

  it("respects an explicit branch id", () => {
    const payload = toFacilityPayload(baseValues({ branch_id: "brn_marina" }), scope);

    expect(payload.branch_id).toBe("brn_marina");
  });

  it("falls back to the scope branch id when the form leaves branch blank", () => {
    const payload = toFacilityPayload(baseValues({ branch_id: "" }), scope);

    expect(payload.branch_id).toBe(scope.branchId);
  });

  it("falls back to the empty string when both form and scope are blank", () => {
    const payload = toFacilityPayload(baseValues({ branch_id: "" }), {
      organizationId: null,
      branchId: null,
      seasonId: null,
    });

    expect(payload.branch_id).toBe("");
  });

  it("parses capacity into an integer and floors an empty string to 0", () => {
    expect(toFacilityPayload(baseValues({ capacity: "18" }), scope).capacity).toBe(18);
    expect(toFacilityPayload(baseValues({ capacity: "" }), scope).capacity).toBe(0);
  });

  it("passes through the indoor + active toggles", () => {
    const payload = toFacilityPayload(
      baseValues({ indoor: true, is_active: false }),
      scope,
    );

    expect(payload.indoor).toBe(true);
    expect(payload.is_active).toBe(false);
  });
});
