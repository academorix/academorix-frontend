/**
 * @file quota-meter.tsx
 * @module components/billing/quota-meter
 *
 * @description
 * Small progress-meter chip showing "used / limit" for a single entitlement
 * key (e.g. `athlete_slot`, `branch_slot`). Reads from the identity-embedded
 * `quota_summary` via {@link "@/lib/billing" useQuotaFor} — no fetch. Silent
 * (renders nothing) when the key has no metered limit (unlimited grants are
 * stripped by the backend from `me.quota_summary`).
 *
 * Two visual variants:
 * - `inline` (default) — a compact bar suitable next to a list header or an
 *   "Add …" affordance.
 * - `card` — a larger block for dashboards + billing pages.
 */

import type { ReactNode } from "react";

import { useQuotaFor } from "@/lib/billing";

/** Percent-used → semantic tone. Warns at 80%, alarms at 100%. */
type MeterTone = "success" | "warning" | "danger";

/** Props for {@link QuotaMeter}. */
interface QuotaMeterProps {
  /**
   * Entitlement key to look up (e.g. `"athlete_slot"`). If unknown /
   * unmetered / unlimited, the component renders nothing.
   */
  quotaKey: string;
  /**
   * Optional human-readable label. Defaults to a title-cased version of the
   * quota key (e.g. `"Athlete slot"` for `"athlete_slot"`).
   */
  label?: string;
  /** Rendering style — compact inline or a fuller card. */
  variant?: "inline" | "card";
  /** Extra className passed through to the outer element. */
  className?: string;
}

/** Title-cases + de-snakes an entitlement key for the default label. */
function humanize(key: string): string {
  return key
    .split(/[_\s]+/)
    .map((part) => (part.length > 0 ? part[0]!.toUpperCase() + part.slice(1) : ""))
    .join(" ");
}

/** Chooses a tone based on how close to the limit the caller is. */
function toneFor(used: number, limit: number): MeterTone {
  if (limit <= 0) {
    return "danger";
  }

  const ratio = used / limit;

  if (ratio >= 1) {
    return "danger";
  }

  if (ratio >= 0.8) {
    return "warning";
  }

  return "success";
}

/** Tailwind color classes per tone. */
const TONE_BAR: Record<MeterTone, string> = {
  success: "bg-success",
  warning: "bg-warning",
  danger: "bg-danger",
};

/** Text color classes per tone. */
const TONE_TEXT: Record<MeterTone, string> = {
  success: "text-muted",
  warning: "text-warning",
  danger: "text-danger",
};

/**
 * Renders a metered progress bar for the given entitlement key. Silent when
 * the caller has no ceiling for that key.
 *
 * @param props - The quota key to render + optional label + variant.
 */
export function QuotaMeter({
  quotaKey,
  label,
  variant = "inline",
  className,
}: QuotaMeterProps): ReactNode {
  const quota = useQuotaFor(quotaKey);

  // No entry in `/me.quota_summary` means either "unlimited" or "not applicable
  // to this tenant". Render nothing so we don't clutter the UI.
  if (!quota || quota.limit === null) {
    return null;
  }

  const displayLabel = label ?? humanize(quota.key);
  const tone = toneFor(quota.used, quota.limit);
  const percent = Math.min(100, Math.round((quota.used / Math.max(1, quota.limit)) * 100));

  if (variant === "card") {
    return (
      <div
        className={`flex flex-col gap-2 rounded-lg border border-default bg-background p-4 ${className ?? ""}`}
      >
        <div className="flex items-baseline justify-between gap-2">
          <span className="text-sm font-medium text-foreground">{displayLabel}</span>
          <span className={`text-xs font-medium tabular-nums ${TONE_TEXT[tone]}`}>
            {quota.used} / {quota.limit}
          </span>
        </div>
        <div
          aria-label={`${displayLabel} usage`}
          aria-valuemax={quota.limit}
          aria-valuemin={0}
          aria-valuenow={quota.used}
          className="h-2 w-full overflow-hidden rounded-full bg-default/40"
          role="progressbar"
        >
          <div
            className={`h-full rounded-full transition-all ${TONE_BAR[tone]}`}
            style={{ width: `${percent}%` }}
          />
        </div>
      </div>
    );
  }

  // Inline variant: label + bar + count in one row (list-header friendly).
  return (
    <div className={`flex items-center gap-2 text-xs ${className ?? ""}`}>
      <span className="text-muted">{displayLabel}</span>
      <div
        aria-label={`${displayLabel} usage`}
        aria-valuemax={quota.limit}
        aria-valuemin={0}
        aria-valuenow={quota.used}
        className="h-1.5 w-24 overflow-hidden rounded-full bg-default/40"
        role="progressbar"
      >
        <div className={`h-full rounded-full ${TONE_BAR[tone]}`} style={{ width: `${percent}%` }} />
      </div>
      <span className={`tabular-nums ${TONE_TEXT[tone]}`}>
        {quota.used} / {quota.limit}
      </span>
    </div>
  );
}
