/**
 * @file widget-renderer.tsx
 * @module modules/dashboard/widget-renderer
 *
 * @description
 * Dispatch table from a widget catalogue key to its React component.
 * Keeps the dashboard page purely declarative — it maps a user's persisted
 * layout to widgets by key, without knowing about every widget's imports.
 *
 * ## Runtime extension (task F2)
 *
 * Modules can contribute widgets from their own manifest via
 * `AppModule.dashboardWidgets`. The module registry runs
 * {@link registerWidgetRenderer} at boot for every contributed
 * widget so the renderer table stays a single source of truth even
 * when the widget component ships from a peer module. Duplicate
 * keys are idempotent — the first registration wins so Vite HMR
 * doesn't shadow a shipped widget with a hot-reloaded stub.
 */

import type { ReactNode } from "react";

import { DisciplineChart } from "@/components/dashboard/discipline-chart";
import { KpiCards } from "@/components/dashboard/kpi-cards";
import { OnboardingChecklist } from "@/components/dashboard/onboarding-checklist";
import { RecentActivity } from "@/components/dashboard/recent-activity";
import { RevenueChart } from "@/components/dashboard/revenue-chart";
import { UpcomingSessions } from "@/components/dashboard/upcoming-sessions";
import {
  BirthdaysWidget,
  CredentialsExpiringWidget,
  DocumentsMissingWidget,
  KpiAthletesWidget,
  KpiAttendanceRateWidget,
  KpiOpenLeadsWidget,
  KpiRevenueMtdWidget,
  MoneyForecastWidget,
  MoneyOutstandingWidget,
  MoneyRefundsMtdWidget,
  NewAthletesWidget,
  SafeguardingTrainingWidget,
} from "@/components/dashboard/widget-shims";

/**
 * Widget factory — returns a React node for a catalogue key. Kept as
 * a nullary function (rather than a component reference) so a
 * factory can carry per-call state or read a hook when the module
 * registry hasn't shipped its provider yet.
 */
type WidgetFactory = () => ReactNode;

const REGISTRY: Record<string, WidgetFactory> = {
  "onboarding-checklist": () => <OnboardingChecklist />,
  "kpi-strip": () => <KpiCards />,
  "kpi-athletes": () => <KpiAthletesWidget />,
  "kpi-revenue-mtd": () => <KpiRevenueMtdWidget />,
  "kpi-attendance-rate": () => <KpiAttendanceRateWidget />,
  "kpi-open-leads": () => <KpiOpenLeadsWidget />,
  "chart-revenue-week": () => <RevenueChart />,
  "chart-athletes-per-sport": () => <DisciplineChart />,
  "agenda-today": () => <UpcomingSessions />,
  "list-recent-activity": () => <RecentActivity />,
  "list-birthdays": () => <BirthdaysWidget />,
  "list-new-athletes": () => <NewAthletesWidget />,
  "money-outstanding-balance": () => <MoneyOutstandingWidget />,
  "money-refunds-mtd": () => <MoneyRefundsMtdWidget />,
  "money-forecast": () => <MoneyForecastWidget />,
  "compliance-credentials-expiring": () => <CredentialsExpiringWidget />,
  "compliance-documents-missing": () => <DocumentsMissingWidget />,
  "compliance-safeguarding-training": () => <SafeguardingTrainingWidget />,
};

export function renderWidget(key: string): ReactNode {
  const factory = REGISTRY[key];

  return factory ? factory() : null;
}

/**
 * Register a widget renderer at runtime (task F2). Called by the
 * module registry at boot for every widget declared on a module
 * manifest.
 *
 * Idempotent by key — the first registration wins. That keeps Vite
 * HMR sane: a hot-reloaded manifest re-runs the registration path,
 * but shadowing a shipped renderer with a stale closure would
 * blank the widget on the next render.
 *
 * @param key     Widget catalogue key. Must match the corresponding
 *                {@link WidgetEntry.key} passed to `registerWidget`.
 * @param factory Nullary function returning the React tree to
 *                render for the widget. Kept as a factory (not a
 *                component reference) so it can close over module-
 *                scope state at call time.
 */
export function registerWidgetRenderer(key: string, factory: WidgetFactory): void {
  // First registration wins — mirrors the guard on
  // `registerWidget` so both surfaces stay HMR-safe.
  if (key in REGISTRY) {
    return;
  }

  REGISTRY[key] = factory;
}
