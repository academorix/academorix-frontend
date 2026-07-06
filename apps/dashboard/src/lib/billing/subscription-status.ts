/**
 * @file subscription-status.ts
 * @module lib/billing/subscription-status
 *
 * @description
 * Presentational helpers for the subscription state machine. Given a
 * `SubscriptionSummary`, decides what banner (if any) the shell should render
 * — what tone (info/warning/danger/success), what copy, what CTA — without
 * baking those decisions into the component so they stay easy to change and
 * to test.
 *
 * The state machine mirrors the backend `SubscriptionStatus` enum. See
 * BACKEND_HANDOFF.md §5.1 + `modules/Subscription/src/Enums/SubscriptionStatus.php`.
 */

import type { SubscriptionStatus, SubscriptionSummary } from "@/types";

/** Visual tone the banner should render in. */
export type SubscriptionTone = "info" | "warning" | "danger" | "success";

/** Descriptor of the banner to render (or `null` for silent states). */
export interface SubscriptionBannerDescriptor {
  /** Which visual tone (semantic color). */
  tone: SubscriptionTone;
  /** Short headline the banner leads with. */
  title: string;
  /** Optional secondary line (e.g. "Trial ends on Aug 12"). */
  description?: string;
  /** Label for the primary CTA (e.g. "Choose a plan"). */
  ctaLabel: string;
  /** Path the CTA navigates to. */
  ctaHref: string;
  /**
   * Whether the banner may be dismissed by the caller. Dismissable banners
   * are informational; non-dismissable ones represent states that need
   * action (past_due, grace, suspended, canceled).
   */
  dismissable: boolean;
}

/** ISO-8601 → local short-date string (e.g. `"Aug 12"`). Falls back to `"soon"`. */
function formatDate(iso: string | null): string {
  if (!iso) {
    return "soon";
  }

  try {
    return new Date(iso).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
    });
  } catch {
    return "soon";
  }
}

/** ISO-8601 → whole-number days from now (min 0). */
function daysUntil(iso: string | null): number | null {
  if (!iso) {
    return null;
  }

  const then = new Date(iso).getTime();

  if (Number.isNaN(then)) {
    return null;
  }

  const diffMs = then - Date.now();

  return Math.max(0, Math.round(diffMs / 86_400_000));
}

/** Copy-of-`SUBSCRIPTION_STATUS_LABELS` fallback (kept local to sidestep an import). */
const STATUS_LABEL: Record<SubscriptionStatus, string> = {
  trialing: "Trialing",
  active: "Active",
  past_due: "Past due",
  grace: "Grace period",
  suspended: "Suspended",
  paused: "Paused",
  canceled: "Canceled",
};

/**
 * Given a subscription snapshot (or `null` for a tenant that hasn't checked
 * out yet), decides which banner the shell should render.
 *
 * Returns `null` for the two silent states — `active` (all good) and any
 * unrecognised status the backend might send us in future.
 */
export function bannerFor(
  subscription: SubscriptionSummary | null,
  billingPath = "/settings/billing",
): SubscriptionBannerDescriptor | null {
  // No subscription yet — onboarding CTA.
  if (subscription === null) {
    return {
      tone: "info",
      title: "Choose a plan to activate your workspace",
      description: "You have full access during setup. Pick a plan to keep going.",
      ctaLabel: "See plans",
      ctaHref: billingPath,
      dismissable: false,
    };
  }

  switch (subscription.status) {
    case "trialing": {
      const days = daysUntil(subscription.trial_ends_at);

      return {
        tone: "info",
        title:
          days !== null ? `Trial ends in ${days} day${days === 1 ? "" : "s"}` : "You're on a trial",
        description:
          subscription.trial_ends_at !== null
            ? `Add a payment method before ${formatDate(subscription.trial_ends_at)} to keep your workspace.`
            : "Add a payment method to keep your workspace after the trial ends.",
        ctaLabel: "Add payment method",
        ctaHref: billingPath,
        dismissable: true,
      };
    }

    case "past_due":
      return {
        tone: "danger",
        title: "Payment failed",
        description:
          "We couldn't charge your card. Update your payment method to avoid interruption.",
        ctaLabel: "Update payment",
        ctaHref: billingPath,
        dismissable: false,
      };

    case "grace":
      return {
        tone: "danger",
        title: `Grace period ends ${formatDate(subscription.grace_ends_at)}`,
        description:
          "Your workspace stays active until then. Update your payment method to restore your subscription.",
        ctaLabel: "Update payment",
        ctaHref: billingPath,
        dismissable: false,
      };

    case "suspended":
      return {
        tone: "danger",
        title: "Subscription suspended",
        description:
          "Your workspace is read-only until you reactivate. Your data is safe and will be restored on payment.",
        ctaLabel: "Reactivate",
        ctaHref: billingPath,
        dismissable: false,
      };

    case "paused":
      return {
        tone: "warning",
        title: "Subscription paused",
        description: "Resume your subscription when you're ready to keep going.",
        ctaLabel: "Resume subscription",
        ctaHref: billingPath,
        dismissable: false,
      };

    case "canceled":
      return {
        tone: "warning",
        title: subscription.current_period_ends_at
          ? `Access ends ${formatDate(subscription.current_period_ends_at)}`
          : "Subscription canceled",
        description: "Your subscription is canceled. Reactivate anytime to restore full access.",
        ctaLabel: "Reactivate",
        ctaHref: billingPath,
        dismissable: false,
      };

    case "active":
      return null;

    default:
      // Forward-compatibility: unknown status → silent (don't confuse the user).
      return null;
  }
}

/** Human-readable label for a subscription status (identical to the enum's map). */
export function subscriptionStatusLabel(status: SubscriptionStatus): string {
  return STATUS_LABEL[status] ?? status;
}
