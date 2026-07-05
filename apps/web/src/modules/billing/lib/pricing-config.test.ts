/**
 * @file pricing-config.test.ts
 * @module modules/billing/lib/pricing-config.test
 *
 * @description
 * Unit tests for the pure helpers that back the pricing page:
 * category assignment, comparison-row union, highlight selection, CTA
 * heuristics, and plan ordering. Everything here is pure — no mocks needed.
 */

import { describe, expect, it } from "vitest";

import type { PlanGrant, PlanTier } from "@/types";

import {
  buildComparisonRows,
  categoryFor,
  ctaFor,
  GRANT_CATEGORIES,
  groupComparisonRowsByCategory,
  groupGrantsByCategory,
  highlightsFor,
  PRICING_FAQ,
  sortPlansForDisplay,
} from "@/modules/billing/lib/pricing-config";

/** Builds a plausible plan grant with sane defaults; overrides selectively. */
function makeGrant(overrides: Partial<PlanGrant> & Pick<PlanGrant, "key">): PlanGrant {
  return {
    key: overrides.key,
    label: overrides.label ?? overrides.key,
    type: overrides.type ?? "slot",
    limit: overrides.limit ?? 10,
    is_unlimited: overrides.is_unlimited ?? false,
  };
}

/** Builds a plausible plan tier; overrides selectively. */
function makePlan(overrides: Partial<PlanTier> & Pick<PlanTier, "key">): PlanTier {
  return {
    key: overrides.key,
    label: overrides.label ?? overrides.key,
    description: overrides.description ?? "",
    is_popular: overrides.is_popular ?? false,
    prices: overrides.prices ?? [
      { billing_period: "monthly", amount: "0", currency: "USD" },
      { billing_period: "yearly", amount: "0", currency: "USD" },
    ],
    grants: overrides.grants ?? [],
  };
}

describe("categoryFor", () => {
  it.each<[string, (typeof GRANT_CATEGORIES)[number]]>([
    ["branch_slot", "core"],
    ["organization_slot", "core"],
    ["location_slot", "core"],
    ["athlete_slot", "team"],
    ["guardian_slot", "team"],
    ["coach_slot", "team"],
    ["staff_slot", "team"],
    ["team_slot", "team"],
    ["event_slot", "scheduling"],
    ["session_pool", "scheduling"],
    ["training_slot", "scheduling"],
    ["match_slot", "scheduling"],
    ["storage_gb", "storage"],
    ["document_slot", "storage"],
    ["attachment_slot", "storage"],
    ["message_pool", "communications"],
    ["announcement_slot", "communications"],
    ["email_pool", "communications"],
    ["report_slot", "insights"],
    ["dashboard_slot", "insights"],
    ["ai_assistant", "ai"],
    ["assistant_feature", "ai"],
    ["sso_feature", "security"],
    ["audit_log", "security"],
    ["support_priority", "support"],
    ["onboarding_included", "support"],
  ])("categorises %s as %s", (key, expected) => {
    expect(categoryFor(key)).toBe(expected);
  });

  it("falls back to core for unknown key prefixes", () => {
    expect(categoryFor("something_totally_new")).toBe("core");
  });

  it("matches case-insensitively (uppercase key)", () => {
    expect(categoryFor("ATHLETE_SLOT")).toBe("team");
  });
});

describe("groupGrantsByCategory", () => {
  it("groups grants by their derived category", () => {
    const grants: PlanGrant[] = [
      makeGrant({ key: "athlete_slot" }),
      makeGrant({ key: "branch_slot" }),
      makeGrant({ key: "event_slot" }),
      makeGrant({ key: "storage_gb" }),
    ];

    const grouped = groupGrantsByCategory(grants);

    expect(grouped.core.map((g) => g.key)).toEqual(["branch_slot"]);
    expect(grouped.team.map((g) => g.key)).toEqual(["athlete_slot"]);
    expect(grouped.scheduling.map((g) => g.key)).toEqual(["event_slot"]);
    expect(grouped.storage.map((g) => g.key)).toEqual(["storage_gb"]);
    expect(grouped.support).toEqual([]);
  });

  it("preserves the original order inside each bucket", () => {
    const grants: PlanGrant[] = [
      makeGrant({ key: "athlete_slot" }),
      makeGrant({ key: "team_slot" }),
      makeGrant({ key: "coach_slot" }),
    ];

    expect(groupGrantsByCategory(grants).team.map((g) => g.key)).toEqual([
      "athlete_slot",
      "team_slot",
      "coach_slot",
    ]);
  });
});

describe("buildComparisonRows", () => {
  it("unions grants across plans without duplicates", () => {
    const starter = makePlan({
      key: "starter",
      grants: [makeGrant({ key: "athlete_slot" }), makeGrant({ key: "branch_slot" })],
    });
    const growth = makePlan({
      key: "growth",
      grants: [
        makeGrant({ key: "athlete_slot" }), // duplicate of starter's row
        makeGrant({ key: "team_slot" }), // new
        makeGrant({ key: "sso_feature", type: "feature", limit: 0 }), // new
      ],
    });

    const rows = buildComparisonRows([starter, growth]);

    expect(rows.map((r) => r.key)).toEqual([
      "athlete_slot",
      "branch_slot",
      "team_slot",
      "sso_feature",
    ]);
  });

  it("captures the first-seen label per key", () => {
    const starter = makePlan({
      key: "starter",
      grants: [makeGrant({ key: "athlete_slot", label: "Athletes" })],
    });
    const growth = makePlan({
      key: "growth",
      grants: [makeGrant({ key: "athlete_slot", label: "Different label" })],
    });

    const rows = buildComparisonRows([starter, growth]);

    expect(rows).toHaveLength(1);
    expect(rows[0]!.label).toBe("Athletes");
  });

  it("returns an empty array for an empty catalog", () => {
    expect(buildComparisonRows([])).toEqual([]);
  });
});

describe("groupComparisonRowsByCategory", () => {
  it("skips categories with no rows", () => {
    const rows = buildComparisonRows([
      makePlan({ key: "starter", grants: [makeGrant({ key: "athlete_slot" })] }),
    ]);

    const groups = groupComparisonRowsByCategory(rows);

    // Only the `team` bucket has entries; all other categories are omitted.
    expect(groups).toHaveLength(1);
    expect(groups[0]!.category).toBe("team");
    expect(groups[0]!.rows.map((r) => r.key)).toEqual(["athlete_slot"]);
  });

  it("preserves the canonical category order", () => {
    const rows = buildComparisonRows([
      makePlan({
        key: "growth",
        grants: [
          makeGrant({ key: "storage_gb" }),
          makeGrant({ key: "branch_slot" }),
          makeGrant({ key: "athlete_slot" }),
        ],
      }),
    ]);

    const groups = groupComparisonRowsByCategory(rows);

    // Even though grants were added in a different order, the groups follow
    // the canonical GRANT_CATEGORIES sequence: core → team → … → storage.
    expect(groups.map((g) => g.category)).toEqual(["core", "team", "storage"]);
  });
});

describe("highlightsFor", () => {
  it("prefers boolean features over slot rows", () => {
    const plan = makePlan({
      key: "growth",
      grants: [
        makeGrant({ key: "athlete_slot", label: "Athletes", limit: 100 }),
        makeGrant({ key: "sso_feature", label: "SSO", type: "feature", limit: 1 }),
        makeGrant({ key: "audit_feature", label: "Audit log", type: "feature", limit: 1 }),
      ],
    });

    const highlights = highlightsFor(plan, 3);

    // Features come first: SSO + Audit log, then the slot to backfill.
    expect(highlights[0]).toBe("SSO");
    expect(highlights[1]).toBe("Audit log");
    expect(highlights[2]).toMatch(/up to 100 athletes/i);
  });

  it("renders unlimited slots with an 'Unlimited' prefix", () => {
    const plan = makePlan({
      key: "enterprise",
      grants: [makeGrant({ key: "athlete_slot", label: "Athletes", is_unlimited: true })],
    });

    expect(highlightsFor(plan, 1)).toEqual(["Unlimited athletes"]);
  });

  it("respects the count parameter", () => {
    const plan = makePlan({
      key: "growth",
      grants: [
        makeGrant({ key: "f1", type: "feature", limit: 1 }),
        makeGrant({ key: "f2", type: "feature", limit: 1 }),
        makeGrant({ key: "f3", type: "feature", limit: 1 }),
      ],
    });

    expect(highlightsFor(plan, 2)).toHaveLength(2);
  });

  it("returns an empty list for a plan with no grants", () => {
    expect(highlightsFor(makePlan({ key: "starter" }))).toEqual([]);
  });
});

describe("ctaFor", () => {
  const enterprise = makePlan({ key: "enterprise" });
  const growth = makePlan({ key: "growth" });

  it("routes Enterprise to Contact sales for any caller", () => {
    expect(ctaFor(enterprise, true).kind).toBe("contact_sales");
    expect(ctaFor(enterprise, false).kind).toBe("contact_sales");
  });

  it("routes anonymous callers to Create workspace", () => {
    expect(ctaFor(growth, false).kind).toBe("create_workspace");
    expect(ctaFor(growth, false).label).toMatch(/create workspace/i);
  });

  it("routes authenticated callers to checkout", () => {
    expect(ctaFor(growth, true).kind).toBe("checkout");
    expect(ctaFor(growth, true).label).toMatch(/get started/i);
  });
});

describe("sortPlansForDisplay", () => {
  it("orders plans starter → growth → pro → enterprise", () => {
    const plans = [
      makePlan({ key: "pro" }),
      makePlan({ key: "enterprise" }),
      makePlan({ key: "starter" }),
      makePlan({ key: "growth" }),
    ];

    expect(sortPlansForDisplay(plans).map((p) => p.key)).toEqual([
      "starter",
      "growth",
      "pro",
      "enterprise",
    ]);
  });

  it("does not mutate the input array", () => {
    const plans = [makePlan({ key: "pro" }), makePlan({ key: "starter" })];
    const before = plans.map((p) => p.key);

    sortPlansForDisplay(plans);

    expect(plans.map((p) => p.key)).toEqual(before);
  });
});

describe("PRICING_FAQ", () => {
  it("has unique ids across items", () => {
    const ids = PRICING_FAQ.map((item) => item.id);
    const unique = new Set(ids);

    expect(unique.size).toBe(ids.length);
  });

  it("has non-empty question and answer strings", () => {
    for (const item of PRICING_FAQ) {
      expect(item.question.length).toBeGreaterThan(0);
      expect(item.answer.length).toBeGreaterThan(0);
    }
  });
});
