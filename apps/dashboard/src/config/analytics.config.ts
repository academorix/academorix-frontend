/**
 * @file analytics.config.ts
 * @module config/analytics.config
 *
 * @description
 * Canonical event-name registry for the dashboard. Every named analytics
 * event MUST come from {@link EVENTS} — never a magic string at the call
 * site. A typo in a hard-coded event name only shows up weeks later in
 * the analytics dashboard as a missing tile; a typo in `EVENTS` is a
 * TypeScript error at build time.
 *
 * Split into two layers on purpose:
 *
 *  - {@link EVENTS}            — the registry (frozen at compile time).
 *  - {@link analyticsConfig}   — provider config (which provider is on,
 *                                keys, sample rate). Env-var driven so we
 *                                can flip providers per environment
 *                                without editing code.
 *
 * ## When to add an event
 *
 * Product surfaces have a `data-analytics` attribute per action. When
 * you add a new tracked action, add its id here first, then reference
 * it in the surface. Names read like sentences:
 *
 *  - `<subject>_<past-tense-verb>` for user actions.
 *  - `<subject>_<state-noun>` for state transitions.
 *
 * ## What NOT to track
 *
 *  - PII. Names, emails, phone numbers are hashed before send.
 *  - Free-text search queries (only their length + presence of tokens).
 *  - Anything the user can enter into a form field (safeguarding data,
 *    medical notes, guardian details).
 *
 * See the analytics-emitting modules for the concrete events each subsystem
 * ships: `src/notifications/**`, `src/onboarding/**`, `src/menus/**`.
 * Adding an event there means adding it here too.
 */

/** Provider settings. Env-driven so ops can flip without a redeploy. */
export const analyticsConfig = {
  /**
   * Vercel Web Analytics. Enabled by default when deployed to Vercel
   * (Analytics package auto-detects the runtime). Kill-switch:
   * `VITE_VERCEL_ANALYTICS=0`.
   */
  vercel: {
    enabled: import.meta.env.VITE_VERCEL_ANALYTICS !== "0" && import.meta.env.MODE === "production",
  },

  /**
   * PostHog for product analytics + session replay. Off unless the key
   * is provisioned. Sample rate defaults to 100% during rollout; drop
   * to 10-25% once we're past 10k MAU.
   */
  posthog: {
    enabled: Boolean(import.meta.env.VITE_POSTHOG_KEY),
    apiKey: import.meta.env.VITE_POSTHOG_KEY ?? "",
    apiHost: import.meta.env.VITE_POSTHOG_HOST ?? "https://us.i.posthog.com",
    sampleRate: 1.0,
  },

  /**
   * Sentry for error tracking. `dsn` is public per Sentry design —
   * safe to expose in the client bundle. Off unless the DSN is set.
   */
  sentry: {
    enabled: Boolean(import.meta.env.VITE_SENTRY_DSN),
    dsn: import.meta.env.VITE_SENTRY_DSN ?? "",
    environment: import.meta.env.VITE_APP_ENV ?? "local",
    tracesSampleRate: 0.1,
    replaysSessionSampleRate: 0.0,
    replaysOnErrorSampleRate: 1.0,
  },
} as const;

/**
 * The canonical event registry. Keys are the constant name used at call
 * sites (`EVENTS.commandPaletteOpened`); values are the string sent to
 * the provider. Both are auto-completed by TypeScript.
 */
export const EVENTS = {
  // -------- App lifecycle --------
  appStarted: "app_started",
  appInstalled: "app_installed", // PWA / desktop install
  appUpdated: "app_updated",
  appUpdateAvailable: "app_update_available",
  offlineReady: "offline_ready",

  // -------- Auth --------
  signInSubmitted: "sign_in_submitted",
  signInSucceeded: "sign_in_succeeded",
  signInFailed: "sign_in_failed",
  signOutClicked: "sign_out_clicked",

  // -------- Workspace --------
  workspaceSwitched: "workspace_switched",
  workspaceCreated: "workspace_created",

  // -------- Navigation + palette --------
  navSidebarItemClicked: "nav_sidebar_item_clicked",
  navBreadcrumbClicked: "nav_breadcrumb_clicked",
  commandPaletteOpened: "command_palette_opened",
  commandPaletteSelected: "command_palette_selected",
  keyboardShortcutInvoked: "keyboard_shortcut_invoked",

  // -------- Notifications (emitters live in `src/notifications/**`) --------
  notificationShown: "notification_shown",
  notificationClicked: "notification_clicked",
  notificationDismissed: "notification_dismissed",
  notificationPermissionRequested: "notification_permission_requested",
  notificationPermissionGranted: "notification_permission_granted",
  notificationPermissionDenied: "notification_permission_denied",
  pushSubscriptionCreated: "push_subscription_created",
  pushSubscriptionRenewed: "push_subscription_renewed",
  pushSubscriptionRevoked: "push_subscription_revoked",
  notificationCenterOpened: "notification_center_opened",
  notificationSnoozed: "notification_snoozed",

  // -------- Onboarding (emitters live in `src/onboarding/**`) --------
  onboardingTourStarted: "onboarding_tour_started",
  onboardingTourStepAdvanced: "onboarding_tour_step_advanced",
  onboardingTourStepBacked: "onboarding_tour_step_backed",
  onboardingTourSkipped: "onboarding_tour_skipped",
  onboardingTourCompleted: "onboarding_tour_completed",
  onboardingTourRestarted: "onboarding_tour_restarted",
  onboardingChecklistTaskCompleted: "onboarding_checklist_task_completed",
  onboardingChecklistHidden: "onboarding_checklist_hidden",
  onboardingChecklistDismissed: "onboarding_checklist_dismissed",
  onboardingPwaWelcomeShown: "onboarding_pwa_welcome_shown",
  onboardingDesktopWelcomeShown: "onboarding_desktop_welcome_shown",

  // -------- Menus (emitters live in `src/menus/**`) --------
  menuNativeItemClicked: "menu_native_item_clicked",
  menuContextItemClicked: "menu_context_item_clicked",
  menuHelpOpened: "menu_help_opened",
  menuProfileOpened: "menu_profile_opened",

  // -------- Data grids --------
  listFilterApplied: "list_filter_applied",
  listSortApplied: "list_sort_applied",
  listBulkActionInvoked: "list_bulk_action_invoked",
  listExported: "list_exported",
  listSavedViewCreated: "list_saved_view_created",

  // -------- Theme + locale --------
  themeChanged: "theme_changed",
  languageChanged: "language_changed",
  dndToggled: "dnd_toggled",
} as const;

/** Union of every registered event name. */
export type AnalyticsEvent = (typeof EVENTS)[keyof typeof EVENTS];

/**
 * Type-safe key of the registry. Prefer `EVENTS.foo` for direct access;
 * this exists so debugging tools can enumerate every id.
 */
export type AnalyticsEventKey = keyof typeof EVENTS;
