/**
 * @file index.ts
 * @module providers/data
 *
 * @description
 * The **multi-data-provider map** Refine consumes (see PLAN.md §4.5). Every
 * resource resolves through the provider named on its `meta.dataProviderName`,
 * defaulting to `default` when absent — which lets us migrate resources from
 * mock to real API **one at a time**.
 *
 * ## Wiring
 *
 * - `default` — the resolver the majority of resources should use. When
 *   `VITE_API_MOCK` is on this is the mock provider (fast, offline dev); when
 *   off it's the real REST provider (Laravel + Sanctum).
 * - `mock` — always the mock provider. Resources whose backend module hasn't
 *   shipped yet explicitly point `dataProviderName: "mock"` at this — see the
 *   {@link BACKEND_READY_RESOURCES} allow-list applied by the registry.
 *
 * The two entries are the **same instance** when in mock mode (both `default`
 * and `mock` point at the same mock provider), so no double caching.
 */

import type { DataProvider } from "@refinedev/core";

import { env } from "@/config/env";
import { httpClient } from "@/lib/http";
import { createMockDataProvider } from "@/providers/data/mock-data-provider";
import { createRestDataProvider } from "@/providers/data/rest-data-provider";

/**
 * Resources whose backend module ships a `/api/v1/{name}` `apiResource`
 * (see PLAN.md §0.a matrix). A resource **not** in this set is silently
 * pinned to the `mock` provider by the registry, so the SPA keeps working
 * even with `VITE_API_MOCK=false`.
 *
 * When a backend module ships:
 *  1. Add its resource name here.
 *  2. Optional cleanup: delete the fixture at `public/data/<resource>.json`.
 *  3. Ship.
 *
 * The list below is intentionally ordered by owning backend module so a
 * reviewer can eyeball which backend surfaces are wired end-to-end.
 *
 * ## What does NOT belong here
 *
 * Backend endpoints that are exposed as **RPC calls** (not paginated CRUD
 * collections) must not be added — Refine's data provider would issue
 * `getList` shaped requests they don't answer. Today that includes:
 *
 *  - `/api/billing/*` (status, catalog, invoices, checkout, portal, …)
 *    — used by the Billing module's `httpClient`-driven hooks.
 *  - `/api/entitlements/usage`
 *    — used by the Entitlements module's `httpClient` hook.
 *  - `/api/auth/*` (login, logout, refresh, me, …)
 *    — used by the Auth provider.
 *
 * Modules that expose those endpoints register their sidebar entry as a
 * Refine resource with `meta.dataProviderName = "mock"` so any accidental
 * `useList("subscription")` short-circuits to the (empty) mock provider
 * instead of hitting the RPC endpoint.
 */
export const BACKEND_READY_RESOURCES: ReadonlySet<string> = new Set([
  // ─── Tenancy / platform admin ────────────────────────────────────────
  "tenants",

  // ─── Access module (roles + permissions CRUD) ────────────────────────
  "roles",
  "permissions",

  // ─── Attributes module ────────────────────────────────────────────────
  "attribute-sets",

  // ─── Sports module ────────────────────────────────────────────────────
  "sports",
  "tenant-sports",
  "formations",

  // ─── Geography module (nnjeim/world wrapper) ─────────────────────────
  "countries",
  "states",
  "cities",
  "currencies",
  "languages",
  "timezones",

  // ─── FeatureFlag module (tenant + platform features) ─────────────────
  "features",

  // ─── Finance module (11 fixture-first entities) ──────────────────────
  "invoices",
  "invoice-reminders",
  "payments",
  "payment-methods",
  "transactions",
  "tenant-payment-accounts",
  "expenses",
  "expense-categories",
  "sibling-discount-rules",
  "membership-plans",
  "memberships",

  // ─── Athletics module (5 fixture-first entities) ─────────────────────
  "athletes",
  "athlete-guardians",
  "athlete-documents",
  "athlete-enrollments",
  "athlete-transfers",

  // ─── Coaching module (4 fixture-first entities) ──────────────────────
  "coaches",
  "coach-assignments",
  "coach-availability",
  "coach-notes",

  // ─── Teams module (4 fixture-first entities) ─────────────────────────
  "teams",
  "team-members",
  "team-trials",
  "event-teams",

  // ─── Sessions module (5 fixture-first entities) ──────────────────────
  "sessions",
  "training-sessions",
  "session-plans",
  "session-credits",
  "private-sessions",

  // ─── Events module (4 fixture-first entities) ────────────────────────
  "events",
  "event-invitations",
  "event-reminders",
  "calendar-subscriptions",

  // ─── Attendance module (4 fixture-first entities) ────────────────────
  "attendance",
  "attendance-submissions",
  "checkin-logs",
  "reception-visits",

  // ─── Awards module (4 fixture-first entities) ────────────────────────
  "awards",
  "award-types",
  "certificates",
  "certifications",

  // ─── Medical module (5 fixture-first entities) ───────────────────────
  "medical-records",
  "medical-clearances",
  "injuries",
  "treatments",
  "safeguarding-incidents",

  // ─── Assessments module (6 fixture-first entities) ───────────────────
  "assessment-records",
  "test-batteries",
  "test-results",
  "benchmarks",
  "scouting-reports",
  "talent-flags",

  // ─── Compliance module (5 fixture-first entities) ────────────────────
  "consents",
  "policy-acknowledgements",
  "retention-policies",
  "erasure-requests",
  "background-checks",

  // ─── Communication module (6 fixture-first entities) ─────────────────
  "announcements",
  "messages",
  "conversations",
  "notifications",
  "notification-templates",
  "notification-preferences",

  // ─── AI module (6 fixture-first entities) ────────────────────────────
  "ai-conversations",
  "ai-embeddings",
  "ai-runs",
  "ai-tool-calls",
  "tasks",
  "approval-tasks",

  // ─── Development module (6 fixture-first entities) ───────────────────
  "development-pathways",
  "pathway-stages",
  "curriculums",
  "curriculum-weeks",
  "goals",
  "drills",

  // ─── Facilities module (6 fixture-first entities) ────────────────────
  "facilities",
  "branches",
  "regions",
  "resource-bookings",
  "day-passes",
  "passes",

  // ─── Staff module (8 fixture-first entities) ─────────────────────────
  "staff",
  "staff-documents",
  "staff-leave",
  "staff-pay-rates",
  "staff-transfers",
  "staff-bonuses",
  "payroll-runs",
  "payroll-lines",

  // ─── Competitions module (11 fixture-first entities) ─────────────────
  "competitions",
  "competition-fixtures",
  "matches",
  "match-results",
  "match-squad",
  "bracket-nodes",
  "standing-rows",
  "opponent-logos",
  "seasons",
  "registrations",
  "registration-windows",

  // ─── Sync module (3 fixture-first entities) ──────────────────────────
  "sync-conflicts",
  "sync-cursors",
  "sync-queue",

  // ─── Reporting module (2 fixture-first entities) ─────────────────────
  "report-definitions",
  "saved-reports",

  // ─── Ops module (6 fixture-first entities) ───────────────────────────
  "gates",
  "integrations",
  "webhook-endpoints",
  "webhook-deliveries",
  "api-keys",
  "demo-users",

  // ─── PublicSite module (6 fixture-first entities) ────────────────────
  "public-site",
  "leads",
  "offers",
  "packs",
  "waitlist-entries",
  "invitations",
]);

/** The shared mock provider (used by both `default` and `mock` in mock mode). */
const mockDataProvider = createMockDataProvider({
  latencyMs: env.VITE_APP_ENV === "local" ? 250 : 0,
});

/**
 * The provider map Refine consumes. In mock mode the two keys are the same
 * instance so `useList({ resource: "tenants" })` and
 * `useList({ resource: "athletes", meta: { dataProviderName: "mock" } })` both
 * short-circuit to the fixture path.
 *
 * Note: the REST provider's `apiPrefix` is `/v1` because `httpClient.baseUrl`
 * already ends with `/api` (resolved from the host context).
 */
export const dataProviders: { default: DataProvider; [name: string]: DataProvider } =
  env.VITE_API_MOCK
    ? {
        default: mockDataProvider,
        mock: mockDataProvider,
      }
    : {
        default: createRestDataProvider(httpClient, { apiPrefix: "/v1" }),
        mock: mockDataProvider,
      };

/** Convenience export — the default provider (mostly for tests). */
export const dataProvider: DataProvider = dataProviders.default;

export { createMockDataProvider } from "@/providers/data/mock-data-provider";
export { createRestDataProvider } from "@/providers/data/rest-data-provider";
