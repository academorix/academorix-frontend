/**
 * @file subscription-banner.tsx
 * @module components/billing/subscription-banner
 *
 * @description
 * Global subscription state banner shown at the top of every authenticated
 * page. Reads the identity-embedded `SubscriptionSummary` via
 * {@link "@/lib/billing" useSubscription}, decides what (if anything) to render
 * via {@link "@/lib/billing" bannerFor}, and stays silent on the healthy
 * `active` state so a paying tenant sees no chrome.
 *
 * The banner is deliberately unobtrusive but persistent for states that need
 * action (past_due, grace, suspended, canceled) — it can't be dismissed until
 * the underlying condition changes. Informational banners (trialing, no plan)
 * are dismissable via `sessionStorage` so we don't nag between page loads.
 */

import {
  ArrowRightIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  XMarkIcon,
} from "@stackra/ui/icons/heroicon/outline";
import { Button } from "@stackra/ui/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "@stackra/routing/react";

import type { SubscriptionBannerDescriptor, SubscriptionTone } from "@/lib/billing";
import type { IconType } from "@stackra/ui/icons";
import type { ReactNode } from "react";

import { bannerFor, useSubscription } from "@/lib/billing";

/** `sessionStorage` key we use to remember a per-tab dismissal. */
const DISMISS_KEY = "academorix.billing.banner.dismissed";

/** Icon + Tailwind token classes per tone. */
const TONE_STYLES: Record<
  SubscriptionTone,
  {
    icon: IconType;
    container: string;
    iconClass: string;
    ctaVariant: "primary" | "secondary" | "tertiary";
  }
> = {
  info: {
    icon: InformationCircleIcon,
    container: "border-accent/30 bg-accent/10 text-foreground",
    iconClass: "text-accent",
    ctaVariant: "primary",
  },
  success: {
    icon: CheckCircleIcon,
    container: "border-success/30 bg-success/10 text-foreground",
    iconClass: "text-success",
    ctaVariant: "secondary",
  },
  warning: {
    icon: ExclamationTriangleIcon,
    container: "border-warning/40 bg-warning/10 text-foreground",
    iconClass: "text-warning",
    ctaVariant: "primary",
  },
  danger: {
    icon: ExclamationTriangleIcon,
    container: "border-danger/40 bg-danger/10 text-foreground",
    iconClass: "text-danger",
    ctaVariant: "primary",
  },
};

/**
 * Reads the per-tab dismissal from sessionStorage. Fails safe (`false`) when
 * storage is unavailable (SSR, tests, privacy mode).
 */
function readDismissed(): boolean {
  try {
    return window.sessionStorage.getItem(DISMISS_KEY) === "1";
  } catch {
    return false;
  }
}

/** Writes the dismissal marker. */
function writeDismissed(dismissed: boolean): void {
  try {
    if (dismissed) {
      window.sessionStorage.setItem(DISMISS_KEY, "1");
    } else {
      window.sessionStorage.removeItem(DISMISS_KEY);
    }
  } catch {
    // Ignore — the in-memory state below handles this session anyway.
  }
}

/** Renders the actual banner row. Kept internal so the outer component can `return null`. */
function BannerRow({
  descriptor,
  onDismiss,
}: {
  descriptor: SubscriptionBannerDescriptor;
  onDismiss: (() => void) | null;
}): ReactNode {
  const navigate = useNavigate();
  const tone = TONE_STYLES[descriptor.tone];
  const Icon = tone.icon;

  return (
    <div
      className={`flex items-start gap-3 border-b px-4 py-2.5 text-sm ${tone.container}`}
      role="status"
    >
      <Icon aria-hidden="true" className={`mt-0.5 size-4 shrink-0 ${tone.iconClass}`} />
      <div className="flex flex-1 flex-col gap-0.5 sm:flex-row sm:items-center sm:gap-3">
        <span className="font-medium">{descriptor.title}</span>
        {descriptor.description ? (
          <span className="text-muted">{descriptor.description}</span>
        ) : null}
      </div>
      <Button
        aria-label={descriptor.ctaLabel}
        size="sm"
        variant={tone.ctaVariant}
        onPress={() => navigate(descriptor.ctaHref)}
      >
        {descriptor.ctaLabel}
        <ArrowRightIcon aria-hidden="true" className="size-3.5" />
      </Button>
      {onDismiss ? (
        <Button isIconOnly aria-label="Dismiss" size="sm" variant="tertiary" onPress={onDismiss}>
          <XMarkIcon aria-hidden="true" className="size-4" />
        </Button>
      ) : null}
    </div>
  );
}

/**
 * Global subscription banner. Mounts once inside the authenticated shell —
 * silent for `active` subscriptions, informative for trials, urgent for
 * `past_due` / `grace` / `suspended` / `canceled`.
 */
export function SubscriptionBanner(): ReactNode {
  const subscription = useSubscription();
  // Lazy initialiser reads sessionStorage **synchronously** on first render
  // so a page reload with a prior dismissal never flashes the banner before
  // it hides itself. Falls back to `false` in environments without storage.
  const [dismissed, setDismissed] = useState<boolean>(() => readDismissed());

  const descriptor = bannerFor(subscription);

  // Reset dismissal when the underlying state changes (a trial ending should
  // re-surface the banner even if the user dismissed the trial-still-going one).
  // The `isFirstRun` guard prevents this effect from wiping the sessionStorage-
  // hydrated dismissal on the initial mount — we only want to reset when the
  // status *actually* transitions after the component is already alive.
  const isFirstRun = useRef(true);

  useEffect(() => {
    if (isFirstRun.current) {
      isFirstRun.current = false;

      return;
    }

    setDismissed(false);
    writeDismissed(false);
  }, [subscription?.status]);

  const dismiss = useCallback((): void => {
    setDismissed(true);
    writeDismissed(true);
  }, []);

  if (!descriptor) {
    return null;
  }

  if (descriptor.dismissable && dismissed) {
    return null;
  }

  return <BannerRow descriptor={descriptor} onDismiss={descriptor.dismissable ? dismiss : null} />;
}
