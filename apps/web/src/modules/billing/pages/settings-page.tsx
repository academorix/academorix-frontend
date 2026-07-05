/**
 * @file settings-page.tsx
 * @module modules/billing/pages/settings-page
 *
 * @description
 * The tenant's Billing settings — a single, focused page that shows the
 * current plan + subscription state, headline quotas, and recent invoices,
 * plus the actions the tenant can take (pause, resume, cancel, open provider
 * portal, jump to the pricing catalog to change plan).
 *
 * Data sources (`httpClient` — this is **not** a Refine CRUD resource, so we
 * skip the data-provider layer and hit the RPC endpoints directly):
 *
 * - `useSubscription()` — identity-embedded snapshot (silent fallback so we
 *   render immediately after login).
 * - `useBillingStatus()` — same shape, refetched after mutations.
 * - `useBillingInvoices()` — invoices list.
 * - `useQuotaSummary()` — headline quotas (3-5 rows) from `/me`.
 *
 * Mutations mount their own hooks (`useChangePlan`, `usePauseSubscription`,
 * `useResumeSubscription`, `useCancelSubscription`, `useOpenBillingPortal`)
 * so a click flow only allocates what it uses.
 *
 * @see BACKEND_HANDOFF.md §4 (route table) + §5 (payload shapes)
 */

import { ExclamationCircleIcon, ReceiptPercentIcon } from "@academorix/ui/icons/outline";
import { Button, Card, Chip, Separator, Spinner } from "@academorix/ui/react";
import { useCallback } from "react";
import { useNavigate } from "react-router";

import type { BillingInvoice, SubscriptionStatus, SubscriptionSummary } from "@/types";
import type { ReactNode } from "react";

import { ResourceAccessGuard } from "@/components/access";
import { QuotaMeter } from "@/components/billing";
import { Breadcrumbs } from "@/components/refine";
import { bannerFor, subscriptionStatusLabel, useQuotaSummary } from "@/lib/billing";
import { formatDate, formatMoney } from "@/lib/format";
import {
  useBillingInvoices,
  useBillingStatus,
  useCancelSubscription,
  useOpenBillingPortal,
  usePauseSubscription,
  useResumeSubscription,
} from "@/modules/billing/hooks/use-billing";
import { PLAN_KEY_LABELS } from "@/types";

/** Path the "Change plan" / "Choose a plan" CTA sends the user to. */
const PRICING_PATH = "/pricing";

/** Chip color per subscription status. */
const STATUS_COLOR: Record<SubscriptionStatus, "success" | "warning" | "danger" | "default"> = {
  trialing: "warning",
  active: "success",
  past_due: "danger",
  grace: "danger",
  suspended: "danger",
  paused: "warning",
  canceled: "default",
};

/** Small labelled detail. Used inside the plan card's `<dl>`. */
function Field({ label, children }: { label: string; children: ReactNode }): ReactNode {
  return (
    <div className="flex flex-col gap-1">
      <dt className="text-xs font-medium tracking-wide text-muted uppercase">{label}</dt>
      <dd className="text-sm text-foreground">{children}</dd>
    </div>
  );
}

/**
 * Empty-state card shown when the tenant has no subscription. Directs the
 * caller to the pricing catalog.
 */
function ChooseAPlanCard({ onGoToPricing }: { onGoToPricing: () => void }): ReactNode {
  return (
    <Card>
      <Card.Header>
        <div className="flex items-center gap-2">
          <ReceiptPercentIcon aria-hidden="true" className="size-5 text-accent" />
          <Card.Title>Choose a plan</Card.Title>
        </div>
        <Card.Description>
          Pick a plan to activate your workspace. You can change or cancel anytime.
        </Card.Description>
      </Card.Header>
      <Card.Content>
        <Button onPress={onGoToPricing}>See plans</Button>
      </Card.Content>
    </Card>
  );
}

/** Plan + status card. */
function PlanCard({
  subscription,
  onOpenPortal,
  onPause,
  onResume,
  onCancel,
  onChangePlan,
  isMutating,
  portalIsPending,
}: {
  subscription: SubscriptionSummary;
  onOpenPortal: () => void;
  onPause: () => void;
  onResume: () => void;
  onCancel: () => void;
  onChangePlan: () => void;
  isMutating: boolean;
  portalIsPending: boolean;
}): ReactNode {
  const planLabel = subscription.plan_key ? PLAN_KEY_LABELS[subscription.plan_key] : "Custom plan";
  const isPaused = subscription.status === "paused";
  const isCanceled = subscription.status === "canceled";
  const isTerminalOrPaused = isPaused || isCanceled;

  return (
    <Card>
      <Card.Header>
        <div className="flex items-center justify-between gap-3">
          <div className="flex flex-col gap-1">
            <Card.Title>{planLabel}</Card.Title>
            <Card.Description>Platform subscription</Card.Description>
          </div>
          <Chip color={STATUS_COLOR[subscription.status]} size="sm" variant="soft">
            {subscriptionStatusLabel(subscription.status)}
          </Chip>
        </div>
      </Card.Header>
      <Card.Content>
        <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="Billing period">
            <span className="capitalize">{subscription.billing_period}</span>
          </Field>
          <Field label="Currency">{subscription.currency}</Field>
          <Field label="Renews">{formatDate(subscription.current_period_ends_at)}</Field>
          {subscription.trial_ends_at ? (
            <Field label="Trial ends">{formatDate(subscription.trial_ends_at)}</Field>
          ) : null}
          {subscription.grace_ends_at ? (
            <Field label="Grace ends">{formatDate(subscription.grace_ends_at)}</Field>
          ) : null}
          {subscription.canceled_at ? (
            <Field label="Canceled">{formatDate(subscription.canceled_at)}</Field>
          ) : null}
        </dl>
      </Card.Content>
      <Separator />
      <div className="flex flex-wrap gap-2 px-6 py-4">
        <Button isDisabled={isMutating} onPress={onChangePlan}>
          Change plan
        </Button>
        {isPaused ? (
          <Button isDisabled={isMutating} variant="secondary" onPress={onResume}>
            Resume
          </Button>
        ) : !isCanceled ? (
          <Button isDisabled={isMutating} variant="secondary" onPress={onPause}>
            Pause
          </Button>
        ) : null}
        <Button isDisabled={portalIsPending} variant="secondary" onPress={onOpenPortal}>
          {portalIsPending ? "Opening…" : "Manage in portal"}
        </Button>
        {!isTerminalOrPaused ? (
          <Button isDisabled={isMutating} variant="tertiary" onPress={onCancel}>
            Cancel subscription
          </Button>
        ) : null}
      </div>
    </Card>
  );
}

/** Headline quotas card. */
function QuotasCard({ onSeeAll }: { onSeeAll: () => void }): ReactNode {
  const summary = useQuotaSummary();

  if (summary.length === 0) {
    return null;
  }

  return (
    <Card>
      <Card.Header>
        <div className="flex items-center justify-between gap-2">
          <Card.Title>Plan usage</Card.Title>
          <Button size="sm" variant="tertiary" onPress={onSeeAll}>
            See full matrix
          </Button>
        </div>
        <Card.Description>Headline entitlements included with your plan.</Card.Description>
      </Card.Header>
      <Card.Content>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {summary.map((row) => (
            <QuotaMeter key={row.key} quotaKey={row.key} variant="card" />
          ))}
        </div>
      </Card.Content>
    </Card>
  );
}

/** Invoice status → Chip color. */
const INVOICE_STATUS_COLOR: Record<
  BillingInvoice["status"],
  "success" | "warning" | "danger" | "default"
> = {
  paid: "success",
  open: "warning",
  past_due: "danger",
  void: "default",
  refunded: "default",
};

/** Invoices table (server-rendered list). */
function InvoicesCard(): ReactNode {
  const { data: invoices, isLoading, error } = useBillingInvoices();

  return (
    <Card>
      <Card.Header>
        <Card.Title>Invoices</Card.Title>
        <Card.Description>Recent billing statements from Academorix.</Card.Description>
      </Card.Header>
      <Card.Content>
        {isLoading ? (
          <div className="flex h-24 items-center justify-center">
            <Spinner aria-label="Loading invoices" />
          </div>
        ) : error ? (
          <div className="flex items-start gap-2 rounded-md border border-danger/30 bg-danger/5 p-3 text-sm text-danger">
            <ExclamationCircleIcon aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
            <span>{error.message}</span>
          </div>
        ) : invoices && invoices.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-xs font-medium tracking-wide text-muted uppercase">
                <tr>
                  <th className="pr-4 pb-3">Number</th>
                  <th className="pr-4 pb-3">Issued</th>
                  <th className="pr-4 pb-3">Status</th>
                  <th className="pr-4 pb-3">Total</th>
                  <th className="pb-3">Document</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-default/40">
                {invoices.map((invoice) => (
                  <tr key={invoice.id}>
                    <td className="py-3 pr-4 font-medium text-foreground">{invoice.number}</td>
                    <td className="py-3 pr-4 text-muted">{formatDate(invoice.issued_at)}</td>
                    <td className="py-3 pr-4">
                      <Chip color={INVOICE_STATUS_COLOR[invoice.status]} size="sm" variant="soft">
                        {invoice.status}
                      </Chip>
                    </td>
                    <td className="py-3 pr-4 tabular-nums">
                      {formatMoney(invoice.total, invoice.currency)}
                    </td>
                    <td className="py-3">
                      {invoice.pdf_url ? (
                        <a
                          className="text-sm text-accent hover:underline"
                          href={invoice.pdf_url}
                          rel="noreferrer"
                          target="_blank"
                        >
                          Download PDF
                        </a>
                      ) : (
                        <span className="text-sm text-muted">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm text-muted">No invoices yet.</p>
        )}
      </Card.Content>
    </Card>
  );
}

/**
 * The Billing settings page. Registered by the billing module at
 * `/settings/billing`.
 */
export default function BillingSettingsPage(): ReactNode {
  const navigate = useNavigate();
  const {
    data: status,
    isLoading: statusLoading,
    error: statusError,
    refetch: refetchStatus,
  } = useBillingStatus();

  const changePlan = useCallback((): void => {
    navigate(PRICING_PATH);
  }, [navigate]);

  const seeAllQuotas = useCallback((): void => {
    navigate("/usage");
  }, [navigate]);

  const pause = usePauseSubscription();
  const resume = useResumeSubscription();
  const cancel = useCancelSubscription();
  const portal = useOpenBillingPortal();

  const isMutating = pause.isPending || resume.isPending || cancel.isPending;

  const handlePause = useCallback(async (): Promise<void> => {
    try {
      await pause.mutate();
      await refetchStatus();
    } catch {
      // Error is surfaced via `pause.error`; swallow re-throw to avoid unhandled rejection.
    }
  }, [pause, refetchStatus]);

  const handleResume = useCallback(async (): Promise<void> => {
    try {
      await resume.mutate();
      await refetchStatus();
    } catch {
      /* handled in state */
    }
  }, [refetchStatus, resume]);

  const handleCancel = useCallback(async (): Promise<void> => {
    if (
      !window.confirm("Cancel your subscription? You'll keep access until the current period ends.")
    ) {
      return;
    }

    try {
      await cancel.mutate();
      await refetchStatus();
    } catch {
      /* handled in state */
    }
  }, [cancel, refetchStatus]);

  const handleOpenPortal = useCallback(async (): Promise<void> => {
    try {
      const { url } = await portal.mutate();

      window.location.href = url;
    } catch {
      /* handled in state */
    }
  }, [portal]);

  const banner = bannerFor(status);
  const mutationError = pause.error ?? resume.error ?? cancel.error ?? portal.error;

  return (
    <ResourceAccessGuard action="list" resource="subscription">
      <div className="flex flex-col gap-6 p-6">
        <div className="flex flex-col gap-4">
          <Breadcrumbs />
          <Separator />
          <h1 className="text-2xl font-semibold text-foreground">Billing</h1>
          {banner ? (
            <p className="text-sm text-muted">{banner.description ?? banner.title}</p>
          ) : null}
        </div>

        {statusError ? (
          <div className="flex items-start gap-2 rounded-md border border-danger/30 bg-danger/5 p-3 text-sm text-danger">
            <ExclamationCircleIcon aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
            <span>{statusError.message}</span>
          </div>
        ) : null}

        {mutationError ? (
          <div className="flex items-start gap-2 rounded-md border border-danger/30 bg-danger/5 p-3 text-sm text-danger">
            <ExclamationCircleIcon aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
            <span>{mutationError.message}</span>
          </div>
        ) : null}

        {statusLoading ? (
          <div className="flex h-40 items-center justify-center">
            <Spinner aria-label="Loading subscription" />
          </div>
        ) : status ? (
          <PlanCard
            isMutating={isMutating}
            portalIsPending={portal.isPending}
            subscription={status}
            onCancel={handleCancel}
            onChangePlan={changePlan}
            onOpenPortal={handleOpenPortal}
            onPause={handlePause}
            onResume={handleResume}
          />
        ) : (
          <ChooseAPlanCard onGoToPricing={changePlan} />
        )}

        <QuotasCard onSeeAll={seeAllQuotas} />
        <InvoicesCard />
      </div>
    </ResourceAccessGuard>
  );
}
