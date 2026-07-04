/**
 * @file lead-form.test.ts
 * @module modules/leads/components/lead-form.test
 *
 * @description
 * Unit tests for the pure {@link toLeadPayload} builder: name/source trimming,
 * empty-string -> `null` coercion for nullable contact fields, the unassigned
 * owner sentinel -> `null` mapping, and injection of `organization_id` /
 * `branch_id` from the active scope (with the empty-string fallback when the
 * scope ids are `null`).
 */

import { describe, expect, it } from "vitest";

import type { ActiveScope } from "@/lib/scope";
import type { LeadFormValues } from "@/modules/leads/components/lead-form";

import { toLeadPayload } from "@/modules/leads/components/lead-form";

/** The sentinel option id the form uses for "no owner" (maps to `null`). */
const UNASSIGNED_OWNER = "__unassigned__";

const baseValues: LeadFormValues = {
  name: "  Jordan Reyes  ",
  contact_email: "",
  contact_phone: "",
  sport_key: "",
  stage: "new",
  source: "  web  ",
  owner_id: UNASSIGNED_OWNER,
  note: "",
};

const scope: ActiveScope = { organizationId: "org-1", branchId: "br-9", seasonId: null };

describe("toLeadPayload", () => {
  it("trims the name and source", () => {
    const payload = toLeadPayload(baseValues, scope);

    expect(payload.name).toBe("Jordan Reyes");
    expect(payload.source).toBe("web");
  });

  it("maps empty nullable fields to null", () => {
    const payload = toLeadPayload(baseValues, scope);

    expect(payload.contact_email).toBeNull();
    expect(payload.contact_phone).toBeNull();
    expect(payload.sport_key).toBeNull();
    expect(payload.note).toBeNull();
  });

  it("trims and keeps non-empty nullable fields", () => {
    const payload = toLeadPayload(
      { ...baseValues, contact_email: "  jordan@example.com  ", note: "  Follow up  " },
      scope,
    );

    expect(payload.contact_email).toBe("jordan@example.com");
    expect(payload.note).toBe("Follow up");
  });

  it("maps the unassigned owner sentinel to null", () => {
    expect(toLeadPayload(baseValues, scope).owner_id).toBeNull();
  });

  it("keeps a real owner id", () => {
    expect(toLeadPayload({ ...baseValues, owner_id: "staff-7" }, scope).owner_id).toBe("staff-7");
  });

  it("injects organization_id and branch_id from the active scope", () => {
    const payload = toLeadPayload(baseValues, scope);

    expect(payload.organization_id).toBe("org-1");
    expect(payload.branch_id).toBe("br-9");
  });

  it("falls back to empty strings when the scope ids are null", () => {
    const payload = toLeadPayload(baseValues, {
      organizationId: null,
      branchId: null,
      seasonId: null,
    });

    expect(payload.organization_id).toBe("");
    expect(payload.branch_id).toBe("");
  });
});
