/**
 * @file onboarding.config.ts
 * @module config/onboarding.config
 *
 * @description
 * Static configuration for the onboarding subsystem — first-run tour
 * steps, dashboard checklist tasks, storage keys, and surface-specific
 * flags. Runtime state (which step the user is on, what's completed)
 * lives in `src/onboarding/*`.
 *
 * See the surface-detection + storage + tour + checklist modules under
 * `src/onboarding/**` for the concrete flows this config drives.
 *
 * ## Status
 *
 * The **types** are stable; every renderer consumes them. The **step /
 * task registries** below are seed data that the actual implementations
 * in `src/onboarding/tour/steps/*` and `src/modules/dashboard/widgets/
 * onboarding-checklist/*` extend at runtime.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** The surface the user is currently on. */
export type OnboardingSurface = "web" | "pwa" | "pwa-shortcut" | "desktop" | "deep-link";

/** A single tour step definition. */
export interface OnboardingTourStep {
  /** Stable id — analytics event property. */
  id: string;
  /** Zero-indexed step number. Controls ordering. */
  order: number;
  /** i18n key for the popover title. */
  titleKey: string;
  /** i18n key for the popover body. */
  bodyKey: string;
  /**
   * CSS selector for the anchor element. HeroUI Popover positions the
   * popover next to the first matching element. Absent = anchored to
   * screen center.
   */
  anchorSelector?: string;
  /** i18n key for the primary CTA (default `menu.next`). */
  ctaKey?: string;
  /**
   * Optional surfaces filter — omit or empty to show on ALL surfaces.
   * `["pwa", "pwa-shortcut"]` limits a step to installed-app launches.
   */
  surfaces?: readonly OnboardingSurface[];
}

/** A single checklist task definition. */
export interface OnboardingChecklistTask {
  /** Stable id — analytics event property + storage key. */
  id: string;
  /** i18n key for the task label. */
  labelKey: string;
  /** i18n key for the task description. */
  descriptionKey: string;
  /** Router path to jump to when the user clicks "Do it now". */
  path: string;
  /**
   * If true, the task is only completed when the user explicitly
   * clicks "Mark done" — no automatic detection. Used for the manual-
   * mark tasks in the 12-task checklist below.
   */
  manualMark: boolean;
  /**
   * Resource whose row count marks the task complete when > 0. Consumed
   * by the checklist widget's `useList()` calls. Only meaningful when
   * `manualMark: false`.
   */
  detectResource?: string;
}

// ---------------------------------------------------------------------------
// Storage
// ---------------------------------------------------------------------------

/**
 * localStorage keys. All keyed by the user id at runtime — schema
 * version suffix (`v1`) lets us re-fire the flow when the step list
 * materially changes without stomping on legacy state.
 */
export const ONBOARDING_STORAGE_KEYS = {
  tour: "academorix.onboarding.tour.v1",
  checklist: "academorix.onboarding.checklist.v1",
  pwa: "academorix.onboarding.pwa.v1",
  desktop: "academorix.onboarding.desktop.v1",
} as const;

/**
 * Bump `SCHEMA_VERSION` when the tour steps materially change. The
 * onboarding runtime re-fires the tour for existing users when their
 * stored version is older. Used as the storage-key suffix during
 * migrations.
 */
export const ONBOARDING_SCHEMA_VERSION = 1;

// ---------------------------------------------------------------------------
// Tour steps
// ---------------------------------------------------------------------------

/**
 * The four canonical tour steps. Actual step components live in
 * `src/onboarding/tour/steps/*`.
 */
export const TOUR_STEPS: readonly OnboardingTourStep[] = [
  {
    id: "tour.workspace",
    order: 1,
    titleKey: "onboarding.tour.workspace.title",
    bodyKey: "onboarding.tour.workspace.body",
    anchorSelector: '[data-testid="sidebar-athletes"]',
  },
  {
    id: "tour.command-palette",
    order: 2,
    titleKey: "onboarding.tour.palette.title",
    bodyKey: "onboarding.tour.palette.body",
    anchorSelector: '[data-testid="command-palette-trigger"]',
    ctaKey: "onboarding.tour.palette.cta",
  },
  {
    id: "tour.notifications",
    order: 3,
    titleKey: "onboarding.tour.notifications.title",
    bodyKey: "onboarding.tour.notifications.body",
    anchorSelector: '[data-testid="notification-bell"]',
  },
  {
    id: "tour.settings",
    order: 4,
    titleKey: "onboarding.tour.settings.title",
    bodyKey: "onboarding.tour.settings.body",
    anchorSelector: '[data-testid="settings-gear"]',
    ctaKey: "menu.finish",
  },
] as const;

// ---------------------------------------------------------------------------
// Checklist tasks
// ---------------------------------------------------------------------------

/**
 * The 12-task checklist. 9 auto-detected via resource row counts + 3
 * manual-mark. Order matters — this is the rendered display order.
 */
export const CHECKLIST_TASKS: readonly OnboardingChecklistTask[] = [
  {
    id: "profile.complete",
    labelKey: "onboarding.checklist.profile.label",
    descriptionKey: "onboarding.checklist.profile.desc",
    path: "/settings/profile",
    manualMark: true,
  },
  {
    id: "team.invite",
    labelKey: "onboarding.checklist.team.label",
    descriptionKey: "onboarding.checklist.team.desc",
    path: "/settings/team",
    manualMark: false,
    detectResource: "users",
  },
  {
    id: "branch.create",
    labelKey: "onboarding.checklist.branch.label",
    descriptionKey: "onboarding.checklist.branch.desc",
    path: "/branches/create",
    manualMark: false,
    detectResource: "branches",
  },
  {
    id: "athlete.create",
    labelKey: "onboarding.checklist.athlete.label",
    descriptionKey: "onboarding.checklist.athlete.desc",
    path: "/athletes/create",
    manualMark: false,
    detectResource: "athletes",
  },
  {
    id: "billing.setup",
    labelKey: "onboarding.checklist.billing.label",
    descriptionKey: "onboarding.checklist.billing.desc",
    path: "/settings/billing",
    manualMark: true,
  },
  {
    id: "session.create",
    labelKey: "onboarding.checklist.session.label",
    descriptionKey: "onboarding.checklist.session.desc",
    path: "/sessions/create",
    manualMark: false,
    detectResource: "sessions",
  },
  {
    id: "team.create",
    labelKey: "onboarding.checklist.team_create.label",
    descriptionKey: "onboarding.checklist.team_create.desc",
    path: "/teams/create",
    manualMark: false,
    detectResource: "teams",
  },
  {
    id: "attendance.first",
    labelKey: "onboarding.checklist.attendance.label",
    descriptionKey: "onboarding.checklist.attendance.desc",
    path: "/attendance",
    manualMark: false,
    detectResource: "attendance",
  },
  {
    id: "invoice.first",
    labelKey: "onboarding.checklist.invoice.label",
    descriptionKey: "onboarding.checklist.invoice.desc",
    path: "/payments/invoices/create",
    manualMark: false,
    detectResource: "invoices",
  },
  {
    id: "branding.customize",
    labelKey: "onboarding.checklist.branding.label",
    descriptionKey: "onboarding.checklist.branding.desc",
    path: "/settings/branding",
    manualMark: true,
  },
  {
    id: "install.app",
    labelKey: "onboarding.checklist.install.label",
    descriptionKey: "onboarding.checklist.install.desc",
    // The path opens the native install prompt via beforeinstallprompt;
    // desktop users tick this automatically on first launch.
    path: "/dashboard",
    manualMark: false,
  },
  {
    id: "safeguarding.read",
    labelKey: "onboarding.checklist.safeguarding.label",
    descriptionKey: "onboarding.checklist.safeguarding.desc",
    path: "https://docs.academorix.com/safeguarding",
    manualMark: true,
  },
] as const;

// ---------------------------------------------------------------------------
// Aggregate
// ---------------------------------------------------------------------------

/** Bundled onboarding config. */
export const onboardingConfig = {
  storageKeys: ONBOARDING_STORAGE_KEYS,
  schemaVersion: ONBOARDING_SCHEMA_VERSION,
  tour: {
    steps: TOUR_STEPS,
    /** Kill-switch for the tour globally. Also gated by `features.onboardingTour`. */
    enabled: true,
  },
  checklist: {
    tasks: CHECKLIST_TASKS,
    /** Users can dismiss the checklist widget entirely. */
    dismissible: true,
  },
  pwa: {
    /** Show the "Academorix installed" toast on first PWA launch. */
    showWelcomeToast: true,
  },
  desktop: {
    /** Show the pre-app native welcome window on first Tauri launch. */
    showWelcomeWindow: true,
  },
} as const;
