/**
 * @file features.config.ts
 * @module config/features.config
 *
 * @description
 * Compile-time feature flag registry for the dashboard. Every flag here is
 * checked at build time (or on first render for RSC-equivalent server code),
 * so it costs zero JS on the client. For dynamic per-user flags we use the
 * backend's Pennant-backed `feature-flag` module via
 * `src/providers/access-control` — this file is intentionally the "static"
 * layer.
 *
 * ## Flag lifecycle
 *
 *  1. Add the flag here with a boolean default and a docblock explaining
 *     when it flips.
 *  2. Gate the surface with `if (features.foo) { … }` OR the `<Feature>`
 *     boundary component if we ship one later.
 *  3. When the feature stabilises, remove the flag (delete the key + the
 *     guard). Do NOT let flags accumulate as permanent config.
 *
 * ## Naming
 *
 *  - `xEnabled` for straightforward on/off toggles.
 *  - `xMode` for enum-shaped switches with more than two states.
 *  - Prefix with the module name where it matters (`billingLivePlans`,
 *    `attendanceKanban`).
 *
 * ## Env-var override
 *
 * The `envFlag(name, default)` helper reads `VITE_FLAG_{NAME}` from
 * `import.meta.env` so we can hot-flip a feature per environment without a
 * redeploy. Env values `"1"` / `"true"` (case-insensitive) map to `true`,
 * everything else falls through to the default.
 */

/**
 * Reads a boolean flag from `import.meta.env`. Returns `defaultValue`
 * when the env var is unset or malformed.
 *
 * NOTE: `import.meta.env` is Vite-only. This file is safe to import from
 * runtime code but not from `vite.config.ts`. If we ever need a flag at
 * build time, move it to a separate file that doesn't touch `import.meta`.
 */
function envFlag(name: string, defaultValue: boolean): boolean {
  const raw = (import.meta.env as Record<string, string | undefined>)[`VITE_FLAG_${name}`];

  if (raw === undefined) return defaultValue;

  return raw.toLowerCase() === "true" || raw === "1";
}

/**
 * Static feature flag registry. Every consumer imports `features` (not
 * this schema) so tree-shaking + auto-completion work.
 */
export const features = {
  /**
   * PWA update prompt — mounts `<PwaUpdateToast />` in production.
   * Rarely flipped; kept as a flag so incidents can kill the toast if
   * the service-worker update flow breaks.
   */
  pwaUpdatePrompt: envFlag("PWA_UPDATE_PROMPT", true),

  /**
   * Show the onboarding tour on first launch. Kill-switch for the flow
   * described in `ONBOARDING_PLAN.md`.
   */
  onboardingTour: envFlag("ONBOARDING_TOUR", true),

  /**
   * Show the dashboard onboarding checklist widget (`ONBOARDING_PLAN.md`
   * §5). Independent from the tour — some environments want just the
   * checklist without the popover walkthrough.
   */
  onboardingChecklist: envFlag("ONBOARDING_CHECKLIST", true),

  /**
   * Command palette (`⌘K`). Ships behind a flag so we can disable if
   * the palette clashes with a workspace's existing browser extensions.
   */
  commandPalette: envFlag("COMMAND_PALETTE", true),

  /**
   * Right-click context menu on data grid rows / sidebar items.
   * Disabled by default until `MENUS_PLAN.md` Phase 1 lands.
   */
  contextMenu: envFlag("CONTEXT_MENU", false),

  /**
   * Web Push notifications (`NOTIFICATIONS_PLAN.md` Phase 2). Off by
   * default — turned on per-tenant when VAPID keys land in Doppler.
   */
  webPush: envFlag("WEB_PUSH", false),

  /**
   * Native OS notifications via Tauri (`NOTIFICATIONS_PLAN.md` §7 + §11
   * Phase 4). Auto-enabled when `window.__TAURI__` is truthy; kept as a
   * flag so a broken native binding doesn't take down the app.
   */
  nativeNotifications: envFlag("NATIVE_NOTIFICATIONS", true),

  /**
   * Desktop shell (Tauri). Auto-detected at runtime by the
   * `isDesktop()` helper (see `src/desktop/is-desktop.ts`), but kept as
   * a compile-time kill-switch so ops can disable the desktop-only
   * code paths (native menu bar, tray, badge, native notifications)
   * if the native binding is broken in a given release. On in dev by
   * default; ops can flip via `VITE_FLAG_DESKTOP_SHELL=0`.
   */
  desktopShell: envFlag("DESKTOP_SHELL", true),

  /**
   * Widget drag-and-drop on the overview dashboard (`DASHBOARD_UX_PLAN.md`
   * Phase 1d). Off until the react-grid-layout wiring lands.
   */
  overviewDnd: envFlag("OVERVIEW_DND", false),

  /**
   * Kanban view on Leads + Safeguarding lists (`DASHBOARD_UX_PLAN.md`
   * Phase 5). Off in production; enabled per-tenant during rollout.
   */
  kanbanViews: envFlag("KANBAN_VIEWS", false),

  /**
   * Attendance agenda / calendar view (`DASHBOARD_UX_PLAN.md` Phase 5).
   */
  attendanceAgenda: envFlag("ATTENDANCE_AGENDA", false),

  /**
   * Live billing catalog — fetches plans from the backend instead of
   * `public/data/plans.json`. Requires the backend billing module.
   */
  billingLivePlans: envFlag("BILLING_LIVE_PLANS", false),

  /**
   * Emit an `X-Debug: 1` header on every API call. Only enable during
   * a debugging session — leaks version + tenant + user id to logs.
   */
  debugHeaders: envFlag("DEBUG_HEADERS", false),

  /**
   * Show the developer menu in the top bar (see `MENUS_PLAN.md`
   * §developer category). Auto-on in dev, off in prod unless
   * explicitly overridden.
   */
  developerMenu: envFlag("DEVELOPER_MENU", import.meta.env.DEV),
} as const;

/** Union of every registered flag id. */
export type FeatureFlag = keyof typeof features;

/**
 * Type-safe lookup. Prefer `features.foo` for direct access; this exists
 * so runtime consumers (e.g. dev-tools panels) can query by dynamic id.
 */
export function isFeatureEnabled(flag: FeatureFlag): boolean {
  return features[flag];
}

/** Feature flag registry re-exported as a plain object for tests. */
export const featuresConfig = features;
