/**
 * @file use-plans.ts
 * @module lib/billing/use-plans
 *
 * @description
 * Read hook for the tenant-facing plans catalog (`GET /api/v1/plans`). The
 * hook is the single source of truth for "what plans exist right now" —
 * consumed by the billing settings page's plan-change flow and the
 * `/settings/billing/plans` grid.
 *
 * The hook shipped in two modes, controlled by
 * {@link "@/config/features.config" features.billingLivePlans}:
 *
 * 1. **Live** (flag on) — Refine's `useList<Plan>({ resource: "plans" })`
 *    fires against the backend. Response is cached in TanStack Query with
 *    a 15-minute stale time (the plan catalog rarely changes; we would
 *    rather serve a slightly stale card than burn a request on every
 *    settings-page mount). Retries are disabled so a persistent 404/501
 *    (backend not deployed) falls through to the static fallback quickly
 *    rather than churning the tab.
 *
 * 2. **Static fallback** (flag off OR live returned 404/501) — a plain
 *    `fetch("/data/plans.json")` against the SPA's own public folder.
 *    Never throws: on any failure (malformed JSON, network hiccup) we
 *    return an empty catalog so the pages can render their "Coming soon"
 *    empty state.
 *
 * `TODO(backend-endpoint): GET /api/v1/plans` — until the backend billing
 * module ships this endpoint, live mode 404s and the hook silently falls
 * back. Remove this note when the endpoint is live in every environment.
 */

import { useList } from "@refinedev/core";
import { useQuery } from "@tanstack/react-query";

import type { Plan, PlansResponse } from "@/types";

import { features } from "@/config/features.config";
import { ApiError } from "@/lib/http";

// ─────────────────────────────────────────────────────────────────────
// Public surface
// ─────────────────────────────────────────────────────────────────────

/** State emitted by {@link usePlans}. */
export interface UsePlansResult {
  /** Every plan the catalog knows about, in the backend/fixture order. */
  plans: Plan[];
  /** Whether at least one path (live or fallback) is still resolving. */
  isLoading: boolean;
  /**
   * A non-fallback error (e.g. 500 from the live endpoint that isn't a
   * missing-endpoint response). The fallback path never surfaces errors —
   * a failed static fetch is silently degraded to an empty catalog, so the
   * UI just renders the empty state.
   */
  error: Error | null;
  /**
   * The plan the catalog nominates as its "default" pick — used to
   * pre-highlight one card on the change-plan grid for a brand-new
   * tenant. `null` when meta is not available (live path today, since
   * Refine's `useList` unwraps `data` and drops top-level meta).
   */
  defaultPlanId: string | null;
}

// ─────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────

/**
 * How long the browser considers a plans catalog fresh. 15 minutes matches
 * how often marketing typically republishes prices; we prefer a slightly
 * stale card over a burst of duplicate requests as the user tabs between
 * settings pages.
 */
export const PLANS_STALE_TIME_MS = 15 * 60 * 1000;

/** URL of the static fallback, served from `apps/dashboard/public/data/`. */
export const STATIC_PLANS_URL = "/data/plans.json";

/** HTTP status codes that indicate the live endpoint isn't wired yet. */
const MISSING_ENDPOINT_STATUSES: ReadonlySet<number> = new Set([404, 501]);

// ─────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────

/**
 * Best-effort fetch of the static plans catalog. Never rejects — any
 * failure (network offline, malformed JSON, non-2xx) resolves to an empty
 * catalog so the settings pages can render their empty state instead of
 * an error banner.
 */
export async function fetchStaticPlans(): Promise<PlansResponse> {
  const empty: PlansResponse = {
    data: [],
    meta: { default_plan_id: "", currency: "USD" },
  };

  try {
    const response = await fetch(STATIC_PLANS_URL, {
      // Static asset — the SPA server can serve it stale; no need for
      // credentials or custom headers. Explicitly disable cache-busting
      // side-effects so the fetched JSON matches what the CDN cached.
      cache: "force-cache",
    });

    if (!response.ok) {
      return empty;
    }

    const body = (await response.json()) as PlansResponse;

    // Sanity-check: the fixture on disk must have a `data` array. If a
    // deploy ever ships a malformed file we still render, we just show
    // the empty state.
    if (!Array.isArray(body.data)) {
      return empty;
    }

    return {
      data: body.data,
      meta: {
        default_plan_id: body.meta?.default_plan_id ?? "",
        currency: body.meta?.currency ?? "USD",
      },
    };
  } catch {
    return empty;
  }
}

/**
 * Whether an error thrown by the live path indicates the backend endpoint
 * simply isn't wired yet (as opposed to a genuine outage). We fall back
 * to the static catalog on these codes only — a 5xx should stay visible
 * so operators notice a real problem.
 */
function isMissingEndpoint(error: unknown): boolean {
  return error instanceof ApiError && MISSING_ENDPOINT_STATUSES.has(error.statusCode);
}

// ─────────────────────────────────────────────────────────────────────
// The hook
// ─────────────────────────────────────────────────────────────────────

/**
 * Loads the plans catalog. When the {@code billingLivePlans} feature flag
 * is on, the hook prefers the live `GET /api/v1/plans` endpoint (via
 * Refine's `useList<Plan>`). On flag-off or a 404/501 response, it
 * transparently falls back to the static catalog shipped in the SPA's
 * public folder so the billing pages render even before the backend
 * billing module deploys.
 *
 * Both paths are cached in TanStack Query with a 15-minute stale time.
 */
export function usePlans(): UsePlansResult {
  const liveEnabled = features.billingLivePlans;

  // Path 1: Refine's useList — the primary path. `enabled: false` short-
  // circuits the query entirely when the flag is off, so no request fires
  // and TanStack Query never hits the network for this key.
  const { result: liveResult, query: liveQuery } = useList<Plan>({
    resource: "plans",
    // The plans catalog is small (a handful of tiers); no pagination.
    pagination: { mode: "off" },
    queryOptions: {
      enabled: liveEnabled,
      staleTime: PLANS_STALE_TIME_MS,
      // Fail fast on 404/501 so we can fall back to the static catalog
      // without a slow retry storm.
      retry: false,
    },
  });

  const liveError = liveQuery.error;
  const liveMissing = isMissingEndpoint(liveError);
  const shouldFallback = !liveEnabled || liveMissing;

  // Path 2: static fallback via TanStack Query. Same 15-minute stale time
  // so the fetch cost is amortised across page navigations. Never retries
  // — a failed static fetch degrades to an empty catalog inside the query
  // function itself.
  const fallbackQuery = useQuery<PlansResponse>({
    queryKey: ["billing", "plans", "static"],
    queryFn: fetchStaticPlans,
    enabled: shouldFallback,
    staleTime: PLANS_STALE_TIME_MS,
    retry: false,
  });

  if (shouldFallback) {
    const data = fallbackQuery.data;

    return {
      plans: data?.data ?? [],
      // While the live path is still deciding (loading or errored into
      // the fallback), we surface loading until the fallback settles too.
      isLoading:
        (liveEnabled ? liveQuery.isLoading : false) ||
        fallbackQuery.isLoading ||
        fallbackQuery.isFetching,
      // The fallback path is intentionally silent — the UI's job is to
      // render whatever plans it managed to load, and the "Coming soon"
      // empty state does the rest.
      error: null,
      defaultPlanId: data?.meta?.default_plan_id ? data.meta.default_plan_id : null,
    };
  }

  // Live path — Refine's `useList` unwraps the Foundation envelope's
  // `data` field into `result.data`, but strips the top-level `meta`, so
  // `defaultPlanId` is not available on this branch. Consumers that need
  // it can read it from the tenant's identity subscription instead.
  return {
    plans: (liveResult?.data ?? []) as Plan[],
    isLoading: liveQuery.isLoading,
    error: liveError instanceof Error ? liveError : null,
    defaultPlanId: null,
  };
}
