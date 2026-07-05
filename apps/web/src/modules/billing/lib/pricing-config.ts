/**
 * @file pricing-config.ts
 * @module modules/billing/lib/pricing-config
 *
 * @description
 * Presentation-time configuration for the `/pricing` page. The backend's
 * `PlanTier` catalog is intentionally minimal (label + prices + grants); the
 * Vercel-style pricing page needs a few purely presentational decisions on
 * top of that data:
 *
 * 1. **Categories** — how to group entitlement grants in the comparison
 *    matrix (Team & athletes, Scheduling, Storage, AI, etc.). Derived from
 *    the grant `key` prefix so a new grant automatically lands in the right
 *    section without a config change.
 *
 * 2. **Highlights** — the 4-6 short bullets that render on each plan card.
 *    Chosen per tier to signal what changes as the caller moves up the
 *    catalog (e.g. "1 branch → 5 branches → unlimited").
 *
 * 3. **CTA labels** — Enterprise gets "Contact sales"; other tiers get
 *    "Get started"; anonymous visitors get "Create workspace" regardless.
 *
 * 4. **FAQ** — static Q&A shown at the bottom of the page.
 *
 * These decisions live here (not on the backend) because they're marketing
 * copy tuned per release, not part of the plan contract. When backend adds
 * `PlanTier.highlights` / `PlanGrant.category` / `PlanGrant.description`
 * (Wave 15 §111), swap the derivations here for the real fields in one
 * commit — no page-level changes needed.
 *
 * @see BACKEND_HANDOFF.md §5.3 (`GET /api/billing/catalog` DTO shapes)
 */

import type { PlanGrant, PlanKey, PlanTier } from "@/types";

// ─────────────────────────────────────────────────────────────────────
// Categories
// ─────────────────────────────────────────────────────────────────────

/** Grant category identifiers, in the order they render in the matrix. */
export const GRANT_CATEGORIES = [
  "core",
  "team",
  "scheduling",
  "storage",
  "communications",
  "insights",
  "ai",
  "security",
  "support",
] as const;

/** A single grant category identifier. */
export type GrantCategory = (typeof GRANT_CATEGORIES)[number];

/** Display metadata per category. */
export const GRANT_CATEGORY_META: Record<GrantCategory, { label: string; description: string }> = {
  core: {
    label: "Core platform",
    description: "The workspace foundation — locations, teams, and workspace admin.",
  },
  team: {
    label: "Team & athletes",
    description: "How many athletes, guardians, and staff you can register.",
  },
  scheduling: {
    label: "Scheduling",
    description: "Events, sessions, matches, and attendance.",
  },
  storage: {
    label: "Storage & documents",
    description: "How much file space and how many documents you can attach.",
  },
  communications: {
    label: "Communications",
    description: "Messaging, announcements, and outbound email.",
  },
  insights: {
    label: "Reporting & insights",
    description: "Dashboards, exports, and analytics.",
  },
  ai: {
    label: "AI capabilities",
    description: "The AI assistant, suggestions, and generation.",
  },
  security: {
    label: "Security & governance",
    description: "SSO, audit trail, RBAC depth, and retention.",
  },
  support: {
    label: "Support & onboarding",
    description: "How you get help, and how fast.",
  },
};

/**
 * Maps a grant key to a category by scanning key prefixes. New grant keys
 * automatically land in the right section without any code change; unknown
 * keys fall through to `"core"` so nothing is silently dropped.
 */
export function categoryFor(grantKey: string): GrantCategory {
  const key = grantKey.toLowerCase();

  // Order matters — the first matching prefix wins.
  const rules: Array<[RegExp, GrantCategory]> = [
    [/^(branch|organization|location)/, "core"],
    [/^(team|athlete|guardian|coach|staff|member|user)/, "team"],
    [/^(event|session|training|match|attendance|schedule|calendar)/, "scheduling"],
    [/^(storage|document|file|attachment|media)/, "storage"],
    [/^(message|announcement|email|sms|notification|comm)/, "communications"],
    [/^(report|export|dashboard|analytics|insight)/, "insights"],
    [/^(ai_|assistant_|generat|suggest)/, "ai"],
    [/^(sso|audit|permission|role_|retention|security)/, "security"],
    [/^(support|onboard|sla)/, "support"],
  ];

  for (const [pattern, category] of rules) {
    if (pattern.test(key)) {
      return category;
    }
  }

  return "core";
}

/** Groups grants by category, preserving grant order inside each bucket. */
export function groupGrantsByCategory(grants: PlanGrant[]): Record<GrantCategory, PlanGrant[]> {
  const buckets = Object.fromEntries(
    GRANT_CATEGORIES.map((category) => [category, [] as PlanGrant[]]),
  ) as Record<GrantCategory, PlanGrant[]>;

  for (const grant of grants) {
    buckets[categoryFor(grant.key)].push(grant);
  }

  return buckets;
}

// ─────────────────────────────────────────────────────────────────────
// Comparison matrix rows — union of grant keys across every plan
// ─────────────────────────────────────────────────────────────────────

/** A single row in the comparison matrix. */
export interface ComparisonRow {
  /** Stable grant key (e.g. `"athlete_slot"`). */
  key: string;
  /** Human label — first non-empty label seen across the plans. */
  label: string;
  /** Category — same for every plan (grants are keyed globally). */
  category: GrantCategory;
}

/**
 * Builds the union of grant keys across every plan tier, so the comparison
 * matrix can show one row per grant with a column per plan. Order preserves
 * the first plan's grant order + appends new grants from later plans.
 */
export function buildComparisonRows(plans: PlanTier[]): ComparisonRow[] {
  const seen = new Map<string, ComparisonRow>();

  for (const plan of plans) {
    for (const grant of plan.grants) {
      if (seen.has(grant.key)) {
        continue;
      }

      seen.set(grant.key, {
        key: grant.key,
        label: grant.label,
        category: categoryFor(grant.key),
      });
    }
  }

  return [...seen.values()];
}

/** Groups comparison rows by category, preserving order inside each group. */
export function groupComparisonRowsByCategory(
  rows: ComparisonRow[],
): Array<{ category: GrantCategory; rows: ComparisonRow[] }> {
  return GRANT_CATEGORIES.map((category) => ({
    category,
    rows: rows.filter((row) => row.category === category),
  })).filter((group) => group.rows.length > 0);
}

// ─────────────────────────────────────────────────────────────────────
// Highlight derivation — the 4-6 bullets on each plan card
// ─────────────────────────────────────────────────────────────────────

/**
 * Formats a single grant as a plan-card bullet. Metered slots render as
 * `"Up to 100 athletes"`, unlimited slots as `"Unlimited athletes"`, and
 * boolean features as their label.
 */
function grantAsHighlight(grant: PlanGrant): string {
  if (grant.type === "feature") {
    return grant.label;
  }

  if (grant.is_unlimited || grant.limit === null) {
    return `Unlimited ${grant.label.toLowerCase()}`;
  }

  return `Up to ${grant.limit.toLocaleString()} ${grant.label.toLowerCase()}`;
}

/**
 * Picks the 4-6 most representative grants for a plan card. Prefers boolean
 * features (they signal capabilities cleanly), then falls back to the top
 * slot rows so the caller sees the plan's headline capacity.
 *
 * @param plan - The plan to derive highlights for.
 * @param count - How many highlights to return (default: 5).
 */
export function highlightsFor(plan: PlanTier, count = 5): string[] {
  // Features first — they read as marketing bullets ("AI suggestions",
  // "Priority support") much more naturally than raw slot numbers.
  const features = plan.grants.filter((grant) => grant.type === "feature");
  const slots = plan.grants.filter((grant) => grant.type !== "feature");

  const picks: PlanGrant[] = [...features.slice(0, count)];

  // Backfill with slot rows if we still have space.
  for (const grant of slots) {
    if (picks.length >= count) {
      break;
    }

    picks.push(grant);
  }

  return picks.map(grantAsHighlight);
}

// ─────────────────────────────────────────────────────────────────────
// CTA heuristics
// ─────────────────────────────────────────────────────────────────────

/** What the CTA button on a plan card should do. */
export type PlanCtaKind = "checkout" | "contact_sales" | "create_workspace";

/** Descriptor consumed by the plan card. */
export interface PlanCta {
  /** Button label. */
  label: string;
  /** What clicking the CTA does. */
  kind: PlanCtaKind;
}

/**
 * Decides the CTA for a plan given the caller's auth state. Enterprise
 * always routes to sales; anonymous visitors get "Create workspace" for
 * every tier (they don't have a tenant to check out against yet).
 */
export function ctaFor(plan: PlanTier, isAuthenticated: boolean): PlanCta {
  if (plan.key === "enterprise") {
    return { label: "Contact sales", kind: "contact_sales" };
  }

  if (!isAuthenticated) {
    return { label: "Create workspace", kind: "create_workspace" };
  }

  return { label: "Get started", kind: "checkout" };
}

// ─────────────────────────────────────────────────────────────────────
// FAQ
// ─────────────────────────────────────────────────────────────────────

/** A single FAQ item. */
export interface PricingFaqItem {
  /** Stable id used by the accordion component. */
  id: string;
  /** Question text. */
  question: string;
  /** Answer text (plain, no markup). */
  answer: string;
}

/** Static FAQ entries shown at the bottom of `/pricing`. */
export const PRICING_FAQ: readonly PricingFaqItem[] = [
  {
    id: "trial",
    question: "Is there a free trial?",
    answer:
      "Every workspace starts on a 14-day trial with full access to the Growth plan. Add a payment method any time during the trial to keep going without interruption.",
  },
  {
    id: "change-plan",
    question: "Can I change plans later?",
    answer:
      "Yes. Upgrades apply immediately and are prorated to your current billing period. Downgrades take effect on your next renewal.",
  },
  {
    id: "payment-methods",
    question: "What payment methods do you accept?",
    answer:
      "We accept all major credit and debit cards. Enterprise customers can also pay by bank transfer or invoice on annual terms.",
  },
  {
    id: "limits",
    question: "What happens if I exceed a limit?",
    answer:
      "We soft-cap so nothing breaks — you can still read and export your data. Add-athlete and add-branch flows are paused until you upgrade or the quota resets.",
  },
  {
    id: "cancel",
    question: "Can I cancel anytime?",
    answer:
      "Yes. Cancel from your billing settings and you keep access until the end of the current billing period. Your data stays available for export for 30 days after cancellation.",
  },
  {
    id: "sso",
    question: "Do you support SSO?",
    answer:
      "SAML and OIDC single sign-on are included on the Enterprise plan. Contact sales to arrange setup and a dedicated onboarding session.",
  },
  {
    id: "data-security",
    question: "Where is my data hosted?",
    answer:
      "All customer data is hosted on encrypted infrastructure in the region you select at signup. We're SOC 2 Type II ready and GDPR compliant.",
  },
  {
    id: "custom-domain",
    question: "Can I use a custom domain?",
    answer:
      "Yes. Every workspace gets a subdomain on academorix.app, and Growth+ plans can bind their own custom domain with automatic TLS.",
  },
] as const;

// ─────────────────────────────────────────────────────────────────────
// Plan ordering — Starter → Growth → Pro → Enterprise
// ─────────────────────────────────────────────────────────────────────

/** Canonical display order for plans on the pricing page. */
export const PLAN_ORDER: Record<PlanKey, number> = {
  starter: 0,
  growth: 1,
  pro: 2,
  enterprise: 3,
};

/**
 * Returns the plans sorted for display. Unknown keys fall to the end but
 * keep their relative order so a future plan doesn't crash the sort.
 */
export function sortPlansForDisplay(plans: PlanTier[]): PlanTier[] {
  return [...plans].sort((a, b) => (PLAN_ORDER[a.key] ?? 99) - (PLAN_ORDER[b.key] ?? 99));
}
