/**
 * @file subscription.ts
 * @module types/subscription
 *
 * @description
 * Shapes for the backend's Subscription + Entitlements domain — the plan the
 * tenant is on, its lifecycle state, and the headline quotas used to render
 * banners and meters throughout the shell.
 *
 * These mirror the backend DTOs (`SubscriptionSummaryData`, `QuotaHeadlineData`,
 * `PlanTierData`, `InvoiceData`) so the wire representation is byte-compatible
 * — snake_case at the JSON boundary, camelCase-shaped for TypeScript
 * ergonomics only where the field is genuinely two words on the backend.
 *
 * @see IDENTITY_AND_TENANCY_SPEC.md §11 (Cashier/Paddle billing tier)
 * @see BACKEND_HANDOFF.md §5 (endpoint contracts)
 */

// ─────────────────────────────────────────────────────────────────────
// Plan catalog + subscription lifecycle enums
// ─────────────────────────────────────────────────────────────────────

/**
 * The versioned catalog of platform plans; mirrors the backend
 * `Academorix\Subscription\Enums\PlanKey` enum. Closed set by design — adding
 * a plan is a schema + config event, not a runtime one.
 */
export const PLAN_KEYS = ["starter", "growth", "pro", "enterprise"] as const;

/** A single plan key (e.g. `"growth"`). */
export type PlanKey = (typeof PLAN_KEYS)[number];

/** Human-readable labels for {@link PlanKey}. */
export const PLAN_KEY_LABELS: Record<PlanKey, string> = {
  starter: "Starter",
  growth: "Growth",
  pro: "Pro",
  enterprise: "Enterprise",
};

/**
 * Lifecycle status of a tenant's subscription; mirrors the backend
 * `Academorix\Subscription\Enums\SubscriptionStatus` state machine.
 *
 * `trialing` / `active` / `past_due` / `grace` / `canceled` all keep
 * entitlements active; `suspended` / `paused` disable them. `canceled` is
 * terminal until reactivation via a fresh checkout.
 */
export const SUBSCRIPTION_STATUSES = [
  "trialing",
  "active",
  "past_due",
  "grace",
  "suspended",
  "paused",
  "canceled",
] as const;

/** A single subscription status (e.g. `"active"`). */
export type SubscriptionStatus = (typeof SUBSCRIPTION_STATUSES)[number];

/** Human-readable labels for {@link SubscriptionStatus}. */
export const SUBSCRIPTION_STATUS_LABELS: Record<SubscriptionStatus, string> = {
  trialing: "Trialing",
  active: "Active",
  past_due: "Past due",
  grace: "Grace period",
  suspended: "Suspended",
  paused: "Paused",
  canceled: "Canceled",
};

/**
 * How often the tenant is billed. Backend mirrors `BillingPeriod::Monthly`
 * / `Yearly`; the wire form is snake_case.
 */
export const BILLING_PERIODS = ["monthly", "yearly"] as const;

/** A single billing period (e.g. `"monthly"`). */
export type BillingPeriod = (typeof BILLING_PERIODS)[number];

/** Human-readable labels for {@link BillingPeriod}. */
export const BILLING_PERIOD_LABELS: Record<BillingPeriod, string> = {
  monthly: "Monthly",
  yearly: "Yearly",
};

// ─────────────────────────────────────────────────────────────────────
// Subscription summary — embedded in /me and returned by /billing/status
// ─────────────────────────────────────────────────────────────────────

/**
 * Compact snapshot of a tenant's current subscription state. Powers global
 * banners ("Trial ends in 3 days", "Grace ends tomorrow", "Reactivate your
 * subscription") from a single `/me` read — no per-page /billing/status call.
 *
 * The same shape is returned by `GET /api/billing/status` on demand for the
 * billing settings page.
 */
export interface SubscriptionSummary {
  /** Mirror row id (internal reference). */
  id: number;
  /** Plan tier, or `null` when the tenant is not yet subscribed. */
  plan_key: PlanKey | null;
  /** Vendor plan id (SKU). */
  plan_id: number;
  /** Grant version currently in force. */
  plan_version: number;
  /** Lifecycle status. */
  status: SubscriptionStatus;
  /** Convenience mirror of `status.entitlementsActive()`. */
  entitlements_active: boolean;
  /** Billing cadence. */
  billing_period: BillingPeriod;
  /** ISO-4217 currency code, e.g. `"USD"`. */
  currency: string;
  /** ISO-8601 trial end, or `null`. */
  trial_ends_at: string | null;
  /** ISO-8601 end of the current billing period, or `null`. */
  current_period_ends_at: string | null;
  /** ISO-8601 grace window end (past_due → suspended), or `null`. */
  grace_ends_at: string | null;
  /** ISO-8601 cancellation time, or `null`. */
  canceled_at: string | null;
}

// ─────────────────────────────────────────────────────────────────────
// Quota headlines — embedded in /me for banners + list "used/limit"
// ─────────────────────────────────────────────────────────────────────

/**
 * A single headline quota row. `limit` is `null` for unlimited grants, but
 * the backend omits unlimited rows from `me.quota_summary` so the shell
 * doesn't render an empty meter — see BACKEND_HANDOFF.md §5.1.
 */
export interface QuotaHeadline {
  /** Entitlement key, e.g. `"athlete_slot"`, `"branch_slot"`. */
  key: string;
  /** Currently-used count. */
  used: number;
  /** Grant limit (integer) or `null` for unlimited. */
  limit: number | null;
}

// ─────────────────────────────────────────────────────────────────────
// Full entitlements matrix — returned by /entitlements/usage
// ─────────────────────────────────────────────────────────────────────

/** How an entitlement grant is enforced. */
export type EntitlementType = "slot" | "pool" | "feature";

/** A single entitlement row (full matrix) returned by `/entitlements/usage`. */
export interface EntitlementUsage {
  /** Entitlement key, e.g. `"athlete_slot"`. */
  key: string;
  /** Human label for the entitlement. */
  label: string;
  /** Semantic type — slot (quota), pool (bucket), feature (boolean). */
  type: EntitlementType;
  /** Currently used count (0 for boolean features). */
  used: number;
  /** Grant limit, or `null` when unlimited. */
  limit: number | null;
  /** Whether this entitlement is unlimited. */
  is_unlimited: boolean;
}

// ─────────────────────────────────────────────────────────────────────
// Plan catalog — returned by /billing/catalog (public)
// ─────────────────────────────────────────────────────────────────────

/** A single price for a plan (per billing period). */
export interface PlanPrice {
  /** Billing cadence this price applies to. */
  billing_period: BillingPeriod;
  /** Price in minor units as decimal string (e.g. `"49.00"`). */
  amount: string;
  /** ISO-4217 currency code. */
  currency: string;
}

/** A single grant a plan tier includes. */
export interface PlanGrant {
  key: string;
  label: string;
  type: EntitlementType;
  /** `null` for unlimited slots, or `true` for boolean features. */
  limit: number | null;
  is_unlimited: boolean;
}

/** A single pricing tier in the public catalog. */
export interface PlanTier {
  /** Stable key (matches `PlanKey`). */
  key: PlanKey;
  label: string;
  /** One-line positioning statement. */
  description: string;
  /** Whether this is the "recommended" tier on the pricing page. */
  is_popular: boolean;
  /** Prices, one per billing period. */
  prices: PlanPrice[];
  /** Grants this tier includes. */
  grants: PlanGrant[];
}

// ─────────────────────────────────────────────────────────────────────
// Invoices — returned by /billing/invoices
// ─────────────────────────────────────────────────────────────────────

/** A single SaaS-billing invoice row. */
export interface BillingInvoice {
  id: string;
  number: string;
  /** ISO-8601 issue date. */
  issued_at: string;
  /** ISO-8601 due date, or `null`. */
  due_at: string | null;
  /** ISO-8601 paid date, or `null`. */
  paid_at: string | null;
  status: "paid" | "open" | "past_due" | "void" | "refunded";
  /** Total amount as decimal string. */
  total: string;
  /** ISO-4217 currency. */
  currency: string;
  /** Downloadable PDF URL, or `null` when not yet available. */
  pdf_url: string | null;
}

// ─────────────────────────────────────────────────────────────────────
// Plans catalog (dashboard-facing) — returned by GET /api/v1/plans
// ─────────────────────────────────────────────────────────────────────

/**
 * A single plan record as consumed by the authenticated shell's billing
 * pages. Distinct from {@link PlanTier} (the *marketing* catalog served by
 * the public `/api/billing/catalog` endpoint): dashboard plans are keyed by
 * a stable backend `id`, carry a single already-selected `price` + `cadence`
 * (rather than the full price matrix), and expose the concrete quota grants
 * used to render "you'll get X athlete slots" comparisons on the change-plan
 * card.
 *
 * The wire shape is the byte-compatible mirror of the backend `PlanData` DTO
 * (once shipped) — snake_case, decimal string for `price`, `null` in
 * `quotas` for unlimited grants. See `TODO(backend-endpoint)` markers on
 * `use-plans` for the endpoint status.
 */
export interface Plan {
  /** Stable backend identifier (e.g. `"plan_growth_monthly"`). */
  id: string;
  /** Human-readable plan name (e.g. `"Growth"`). */
  name: string;
  /** Plan tier — matches {@link PlanKey} so callers can map to the
   *  shared label / order tables. */
  tier: PlanKey;
  /** Billing cadence for the price on this record. */
  cadence: BillingPeriod;
  /** Price in decimal string form (e.g. `"49.00"`). Callers pass it
   *  through {@link "@/lib/format" formatMoney} for display. */
  price: string;
  /** ISO-4217 currency code, e.g. `"USD"`. */
  currency: string;
  /**
   * Flat list of highlight feature keys included with this plan
   * (e.g. `["sso", "priority_support"]`). Order is authoritative —
   * the backend/fixture decides the sort. Localise on the FE via a
   * catalog lookup (not baked into this DTO).
   */
  features: string[];
  /**
   * Concrete quota grants, keyed by entitlement key. `null` denotes an
   * unlimited grant so the UI can render an "Unlimited" chip instead of
   * a numeric limit.
   */
  quotas: Record<string, number | null>;
}

/**
 * Metadata that accompanies a {@link PlansResponse}. `default_plan_id`
 * points to the plan the SPA should preselect on the "choose a plan" flow
 * for a brand-new tenant; `currency` is the currency the catalog is priced
 * in (the tenant's locale can trigger a switch on the backend).
 */
export interface PlansResponseMeta {
  /** ID of the plan the catalog considers the "default" pick. */
  default_plan_id: string;
  /** ISO-4217 currency code the catalog is priced in. */
  currency: string;
}

/**
 * The full response envelope for `GET /api/v1/plans`. The dashboard reads
 * this shape from two sources — the live backend when
 * {@link "@/config/features.config" features.billingLivePlans} is on, or the
 * static fixture at `public/data/plans.json` when the flag is off (or the
 * live endpoint responds 404/501).
 */
export interface PlansResponse {
  /** Every plan in the catalog. */
  data: Plan[];
  /** Catalog-level metadata (default plan + currency). */
  meta: PlansResponseMeta;
}
