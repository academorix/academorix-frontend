/**
 * @file commerce.ts
 * @module types/commerce
 *
 * @description
 * Commerce shapes: customer invoices and payments (money-in / AR), recurring
 * memberships, money-out expenses (AP), and the platform subscription
 * (academy → Academorix). Money is captured in a Region's currency; all amounts
 * are decimal **strings** (as Laravel serializes them) to avoid float drift.
 *
 * @see DOMAIN_MODULES_BLUEPRINT.md §16.3 (Payments), §16.5 (Memberships),
 *      §10.19 (Expenses), §10.8 (Billing)
 */

import type { BaseModel, TenantScoped } from "@/types/base";
import type {
  ExpenseCategory,
  ExpenseStatus,
  InvoiceStatus,
  MembershipStatus,
  PaymentStatus,
} from "@/types/enums";

/**
 * A single line on an {@link Invoice}.
 */
export interface InvoiceLine {
  /** What the line charges for, e.g. `"Term fee — U10 Football"`. */
  description: string;
  quantity: number;
  /** Unit price as a decimal string. */
  unit_price: string;
  /** Line total as a decimal string. */
  amount: string;
}

/**
 * A customer **Invoice** (money the academy bills a member/guardian).
 *
 * @see DOMAIN_MODULES_BLUEPRINT.md §16.3 "Billing & Payments"
 */
export interface Invoice extends BaseModel, TenantScoped {
  organization_id: string;
  branch_id: string;
  /** The billed party (guardian/member) user id. */
  customer_id: string;
  /** Athlete the invoice relates to, if applicable. */
  athlete_id: string | null;
  /** Human-friendly invoice number. */
  number: string;
  status: InvoiceStatus;
  /** ISO-4217 currency (from the branch's region). */
  currency: string;
  /** Invoice total as a decimal string. */
  total: string;
  /** Amount paid so far as a decimal string. */
  amount_paid: string;
  lines: InvoiceLine[];
  /** ISO-8601 due date. */
  due_at: string | null;
  /** ISO-8601 issue date. */
  issued_at: string;
}

/**
 * A **Payment** attempt against an invoice (via Stripe in production).
 */
export interface Payment extends BaseModel, TenantScoped {
  invoice_id: string;
  customer_id: string;
  status: PaymentStatus;
  currency: string;
  /** Amount as a decimal string. */
  amount: string;
  /** Payment method label, e.g. `"card"`, `"apple_pay"`, `"cash"`. */
  method: string;
  /** Provider reference (e.g. Stripe PaymentIntent id), or `null` for cash. */
  provider_ref: string | null;
  /** ISO-8601 time the payment settled, or `null` if pending/failed. */
  paid_at: string | null;
}

/**
 * A recurring **Membership / subscription** (academy → member).
 *
 * @see DOMAIN_MODULES_BLUEPRINT.md §16.5 "Recurring Membership & Subscriptions"
 */
export interface Membership extends BaseModel, TenantScoped {
  organization_id: string;
  branch_id: string;
  /** The member (guardian/athlete account). */
  customer_id: string;
  athlete_id: string | null;
  /** Plan name, e.g. `"Monthly — Full Access"`. */
  plan_name: string;
  status: MembershipStatus;
  currency: string;
  /** Recurring price as a decimal string. */
  price: string;
  /** Billing interval, e.g. `"month"`, `"year"`. */
  interval: "week" | "month" | "quarter" | "year";
  /** ISO-8601 current period start. */
  current_period_start: string;
  /** ISO-8601 current period end / next renewal. */
  current_period_end: string;
}

/**
 * A money-out **Expense** (AP), optionally recurring, with a receipt document.
 *
 * @see DOMAIN_MODULES_BLUEPRINT.md §10.19 "Finance — Expenses"
 */
export interface Expense extends BaseModel, TenantScoped {
  branch_id: string;
  category: ExpenseCategory;
  /** Amount as a decimal string. */
  amount: string;
  currency: string;
  status: ExpenseStatus;
  description: string;
  /** Whether the expense recurs each period. */
  is_recurring: boolean;
  /** Recurrence interval when `is_recurring`, else `null`. */
  recurrence: "monthly" | "quarterly" | "yearly" | null;
  /** Reference to the receipt/invoice document, or `null`. */
  receipt_document_id: string | null;
  /** ISO-8601 date the expense was incurred. */
  incurred_at: string;
}

/**
 * The platform **Subscription** (academy → Academorix), with entitlement quotas.
 * A single record per tenant, shown read-mostly in the Billing view.
 *
 * @see DOMAIN_MODULES_BLUEPRINT.md §10.8 "Billing"
 */
export interface Subscription extends BaseModel, TenantScoped {
  /** Plan key, e.g. `"pro"`, `"enterprise"`. */
  plan: string;
  status: MembershipStatus;
  currency: string;
  /** Recurring platform fee as a decimal string. */
  price: string;
  interval: "month" | "year";
  /** ISO-8601 current period end / next renewal. */
  current_period_end: string;
  /** Counted entitlement quotas granted by the plan. */
  quotas: {
    max_organizations: number;
    max_branches: number;
    max_teams: number;
    max_athletes: number;
    /** Storage quota in gigabytes. */
    max_storage_gb: number;
  };
  /** Boolean feature flags granted by the plan. */
  feature_flags: string[];
}
