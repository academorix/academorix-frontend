/**
 * @file use-dashboard-data.ts
 * @module hooks/use-dashboard-data
 *
 * @description
 * Shared runtime loader for the Overview dashboard fixture. Every
 * widget on the Overview page (KPI cards, revenue chart, discipline
 * chart, upcoming sessions) reads its slice from a single JSON file
 * served at `/api/v1/dashboard.json`; the load is memoised
 * module-side so the four widgets share a single fetch even when
 * they mount concurrently.
 *
 * Why one endpoint and not four:
 *
 *  - The four widgets are ALWAYS mounted together on `/dashboard`,
 *    so splitting them into per-widget endpoints buys nothing but
 *    extra request overhead.
 *  - The data is small (~5 KB total). Round-trip cost is dominated
 *    by request setup, not payload size.
 *  - When we flip individual widgets to the real backend, each
 *    consumer will call its own resource hook (e.g. `useList`
 *    against a `revenue-summary` resource) and stop reading from
 *    this loader — the swap is a per-widget concern, not a
 *    per-endpoint one.
 *
 * The loader also serves the fixture data for `authApi.onboarding()`
 * and `authApi.recentActivity()` in mock mode, so those two hooks
 * stay on the real code path (auth-api handles the mocking) without
 * embedding fixture logic in every consumer.
 */

import { useEffect, useState } from "react";

// ---------------------------------------------------------------------------
// Types — declared here so the JSON file remains the single source of truth
// for the data shapes. Consumers `import type { … }` from this module.
// ---------------------------------------------------------------------------

/** Trend direction on a KPI card — drives sparkline colour + icon status. */
export type KpiTrend = "up" | "down" | "neutral";

/** One card in the four-card KPI strip above the widget grid. */
export interface KpiCard {
  id: string;
  title: string;
  value: number;
  /** ISO-4217 currency code when the value is monetary; drives locale format. */
  currency?: string;
  /** Human-readable delta label (e.g. `"+18 this week"`). */
  change: string;
  trend: KpiTrend;
  /** Heroicons/Iconify id rendered inside the header icon slot. */
  icon: string;
  /** Seven-point sparkline series — one bucket per day of the week. */
  series: number[];
}

/** One day's revenue point on the "Revenue this week" chart. */
export interface RevenuePoint {
  day: string;
  revenue: number;
}

/** One bar on the "Athletes per sport" chart. */
export interface DisciplinePoint {
  discipline: string;
  athletes: number;
}

/** One row in the "Today's schedule" widget. */
export interface UpcomingSession {
  id: string;
  title: string;
  coach: string;
  location: string;
  time: string;
  attendees: number;
  capacity: number;
  discipline: string;
}

/** One step in the "Get started" onboarding checklist. */
export interface DashboardOnboardingStep {
  id: string;
  title: string;
  description: string;
  cta: string;
  route: string;
  icon: string;
  complete: boolean;
}

/** Discriminator for activity feed rows. */
export type DashboardActivityKind =
  "registration" | "payment" | "attendance" | "safeguarding" | "match" | "session";

/** One row in the "Recent activity" feed. */
export interface DashboardActivityEntry {
  id: string;
  kind: DashboardActivityKind;
  title: string;
  description: string;
  /** Human-readable relative timestamp — used verbatim in the UI. */
  timestamp: string;
  icon: string;
}

/** Full shape of `/api/v1/dashboard.json`. */
export interface DashboardData {
  kpis: KpiCard[];
  revenueSeries: RevenuePoint[];
  disciplineSeries: DisciplinePoint[];
  upcomingSessions: UpcomingSession[];
  onboardingSteps: DashboardOnboardingStep[];
  recentActivity: DashboardActivityEntry[];
}

// ---------------------------------------------------------------------------
// Fetch cache
// ---------------------------------------------------------------------------

/** URL served by Vite from `public/api/v1/dashboard.json`. */
const DASHBOARD_URL = "/api/v1/dashboard.json";

/**
 * Module-level promise cache — populated on first read, shared by
 * every consumer. Second, third, …, N-th mount hit the cache
 * instead of the network. Kept as the promise (not the resolved
 * value) so concurrent first mounts share a single round-trip.
 */
let dashboardPromise: Promise<DashboardData | null> | null = null;

/**
 * Fetch the dashboard fixture. Returns `null` on any failure so
 * consumers can degrade gracefully to a skeleton / empty state
 * instead of throwing. Cache is populated on first call.
 *
 * Exported so the `authApi.onboarding()` + `authApi.recentActivity()`
 * mock branches can read the same file without re-implementing the
 * fetch + cache logic.
 */
export function loadDashboardData(): Promise<DashboardData | null> {
  if (dashboardPromise) return dashboardPromise;

  dashboardPromise = fetch(DASHBOARD_URL, {
    headers: { Accept: "application/json" },
  })
    .then(async (response): Promise<DashboardData | null> => {
      if (!response.ok) return null;

      const contentType = response.headers.get("content-type") ?? "";

      // Vite's SPA history-fallback serves `index.html` (200 +
      // `text/html`) for any unknown static path — reject that
      // outright so the consumer's error branch fires instead of
      // silently parse-failing on the HTML.
      if (!contentType.includes("application/json")) return null;

      try {
        return (await response.json()) as DashboardData;
      } catch {
        return null;
      }
    })
    .catch((): DashboardData | null => null);

  return dashboardPromise;
}

// ---------------------------------------------------------------------------
// React hook
// ---------------------------------------------------------------------------

/** Envelope returned by {@link useDashboardData}. */
export interface UseDashboardDataResult {
  /** Loaded dashboard fixture, or `null` until the fetch resolves. */
  data: DashboardData | null;
  /** True until the first successful (or failed) fetch settles. */
  isLoading: boolean;
}

/**
 * React hook — subscribes the component to {@link loadDashboardData}
 * and re-renders it once the fixture resolves. Every consumer gets
 * the same reference (module-level cache), so passing the returned
 * data through a memo won't trigger unnecessary re-renders.
 */
export function useDashboardData(): UseDashboardDataResult {
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let cancelled = false;

    void loadDashboardData().then((resolved) => {
      if (cancelled) return;

      setData(resolved);
      setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  return { data, isLoading };
}
