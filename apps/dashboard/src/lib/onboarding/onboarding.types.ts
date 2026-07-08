/**
 * @file onboarding.types.ts
 * @module onboarding/onboarding.types
 *
 * @description
 * The typed contract for the onboarding subsystem — surface detection,
 * tour steps, checklist tasks, and the localStorage schema that persists
 * their state across sessions.
 *
 * Types live here (and not next to their runtime) for one reason: the
 * config layer at {@link "@/config/onboarding.config"} authors the seed
 * registries, and the runtime layer at {@link "@/lib/onboarding"} implements
 * the flows. Both consume this file, and neither knows about the other.
 * That keeps the two layers physically decoupled and prevents a config
 * change from silently breaking a runtime consumer at build time.
 *
 * ## Contract highlights
 *
 * - `OnboardingSurface` is the canonical five-value union. Any code that
 *   branches on "how did the user arrive" MUST route through this type.
 * - `TourStorageState` / `ChecklistStorageState` / `PwaStorageState` /
 *   `DesktopStorageState` are the exact shapes that hit `localStorage`.
 *   Bumping any of them requires bumping `ONBOARDING_SCHEMA_VERSION` in
 *   the config file — see {@link "@/lib/onboarding/storage"} for the version
 *   migration story.
 * - Every shape carries `version` so a future migration can read a stale
 *   payload, migrate it, and write back the new version without dropping
 *   user state.
 */

// ---------------------------------------------------------------------------
// Re-exports from the config layer
// ---------------------------------------------------------------------------

/*
 * The config file already owns the OnboardingSurface / OnboardingTourStep /
 * OnboardingChecklistTask shapes because it's the source of truth for the
 * seed registries. We re-export them here so consumers can pull the whole
 * onboarding type surface from a single import path — mirroring the pattern
 * used by `@/lib/menus` and the notifications module barrel.
 */
export type {
  OnboardingChecklistTask,
  OnboardingSurface,
  OnboardingTourStep,
} from "@/config/onboarding.config";

// ---------------------------------------------------------------------------
// Tour storage
// ---------------------------------------------------------------------------

/**
 * The persisted tour state. Written to `academorix.onboarding.tour.v1` on
 * every tour interaction; read once on mount.
 *
 * Fields:
 *  - `completedAt`: ISO-8601 timestamp of the "Finish" click on the last
 *    step. Set means the tour has been seen through end-to-end at least
 *    once for this schema version.
 *  - `dismissedAt`: ISO-8601 timestamp of a "Skip" click on any step. Set
 *    means the user actively opted out; DIFFERENT from `completedAt` for
 *    analytics purposes (a skipped tour tells us copy is not landing).
 *  - `step`: zero-based index of the last step the user saw. Enables
 *    "resume where you left off" if we ever add it.
 *  - `restartedCount`: how many times the user has manually invoked
 *    `restartTour()` from `Help → Restart tour`. Non-zero means the user
 *    finds the tour valuable — signal to keep polishing it.
 *  - `version`: the schema version the state was written under. A stored
 *    version older than {@link ONBOARDING_SCHEMA_VERSION} triggers a fresh
 *    run for the new step list.
 */
export interface TourStorageState {
  completedAt: string | null;
  dismissedAt: string | null;
  step: number;
  restartedCount: number;
  version: number;
}

/** Default tour state on first render. */
export const DEFAULT_TOUR_STATE: TourStorageState = {
  completedAt: null,
  dismissedAt: null,
  step: 0,
  restartedCount: 0,
  version: 1,
};

// ---------------------------------------------------------------------------
// Checklist storage
// ---------------------------------------------------------------------------

/**
 * Persisted checklist state. Auto-detected tasks derive their `complete`
 * status from a live row count (see {@link "@/lib/onboarding/checklist/detectors"});
 * we only persist the fields that cannot be recovered from the backend:
 *
 *  - `dismissed`: user hid the whole widget. Overrides the auto-hide rule.
 *  - `hidden`: task ids the user hid from the list (per-row X button).
 *  - `manuallyCompleted`: task ids the user ticked via "Mark done".
 *    Reserved for the three manual-mark tasks (branding, safeguarding,
 *    billing) plus any auto task the user chose to mark done early.
 *  - `restoredFromCloud`: set once the backend `/api/v1/users/me/onboarding`
 *    endpoint returns a merged payload. Prevents re-syncing on every mount.
 *  - `version`: schema version.
 *
 * NOTE: we deliberately DO NOT persist `completedTasks` — auto-detection
 * recomputes the total on every mount so a task that flips from "done" to
 * "undone" (e.g. after deleting the last athlete) re-appears.
 */
export interface ChecklistStorageState {
  dismissed: boolean;
  hidden: readonly string[];
  manuallyCompleted: readonly string[];
  restoredFromCloud: boolean;
  version: number;
}

/** Default checklist state on first render. */
export const DEFAULT_CHECKLIST_STATE: ChecklistStorageState = {
  dismissed: false,
  hidden: [],
  manuallyCompleted: [],
  restoredFromCloud: false,
  version: 1,
};

// ---------------------------------------------------------------------------
// PWA storage
// ---------------------------------------------------------------------------

/**
 * Per-user, per-schema tracking of PWA-first-launch affordances. All
 * timestamps are ISO-8601.
 *
 *  - `firstLaunchedAt`: the first render where `useSurface()` returned
 *    `pwa` or `pwa-shortcut`. Drives the one-shot "Academorix installed"
 *    toast.
 *  - `tourCompletedAt`: PWA-specific tour completion timestamp (the tour
 *    has an extra preface step 0 in PWA mode).
 *  - `notificationPromptShownAt`: when we surfaced the "Enable
 *    notifications" CTA at tour end. Suppresses a re-prompt on the next
 *    launch.
 *  - `version`: schema version.
 */
export interface PwaStorageState {
  firstLaunchedAt: string | null;
  tourCompletedAt: string | null;
  notificationPromptShownAt: string | null;
  version: number;
}

/** Default PWA state on first render. */
export const DEFAULT_PWA_STATE: PwaStorageState = {
  firstLaunchedAt: null,
  tourCompletedAt: null,
  notificationPromptShownAt: null,
  version: 1,
};

// ---------------------------------------------------------------------------
// Desktop storage
// ---------------------------------------------------------------------------

/**
 * Per-user, per-schema tracking of desktop-first-launch affordances. All
 * timestamps are ISO-8601.
 *
 *  - `welcomeShownAt`: when the native welcome window opened. Currently
 *    stubbed — the Tauri IPC that opens the window is owned by the
 *    Desktop sub-agent.
 *  - `shortcutCoachmarkShownAt`: when we surfaced the "⌘ Shift A" toast
 *    after tour end. Suppresses re-showing on subsequent launches.
 *  - `updaterOptedInAt`: when the user accepted auto-update on first run.
 *    Stored on the client so the tour doesn't re-ask; also mirrored to
 *    the backend once cloud state lands.
 *  - `version`: schema version.
 */
export interface DesktopStorageState {
  welcomeShownAt: string | null;
  shortcutCoachmarkShownAt: string | null;
  updaterOptedInAt: string | null;
  version: number;
}

/** Default desktop state on first render. */
export const DEFAULT_DESKTOP_STATE: DesktopStorageState = {
  welcomeShownAt: null,
  shortcutCoachmarkShownAt: null,
  updaterOptedInAt: null,
  version: 1,
};

// ---------------------------------------------------------------------------
// Cloud state
// ---------------------------------------------------------------------------

/**
 * The wire payload the frontend sends to (and expects back from)
 * `POST /api/v1/users/me/onboarding`. Same shape in both directions so
 * merging is a straight object assign.
 *
 * TODO(backend-gap): the endpoint does not exist yet. When it lands, no
 * frontend change is required — the {@link "@/lib/onboarding/cloud-state"}
 * module already catches 404 and falls back to localStorage only.
 */
export interface CloudOnboardingState {
  tour: TourStorageState;
  checklist: ChecklistStorageState;
  pwa: PwaStorageState;
  desktop: DesktopStorageState;
}

// ---------------------------------------------------------------------------
// Tour runtime
// ---------------------------------------------------------------------------

/**
 * Snapshot of the tour state exposed by `useTour()`. Consumers (menu bar
 * command, PWA preface step, etc.) read this to render CTAs.
 */
export interface TourRuntimeState {
  /** True when the tour is currently visible on screen. */
  isActive: boolean;
  /** Zero-indexed step number the user is currently viewing. */
  currentStep: number;
  /** Total number of steps in the active step list (may include prefaces). */
  totalSteps: number;
  /** True when the tour has been completed (`completedAt` set). */
  isCompleted: boolean;
  /** True when the tour has been actively dismissed (`dismissedAt` set). */
  isDismissed: boolean;
  /** How many times the user has manually restarted the tour. */
  restartedCount: number;
}

/**
 * Imperative tour controls returned by `useTour()`. Every action is a
 * no-op if the tour has been globally kill-switched
 * (`features.onboardingTour === false`).
 */
export interface TourActions {
  /** Show step 0 and activate. Persists a `restartedCount` bump. */
  restart: () => void;
  /** Advance one step. Persists on last step (records `completedAt`). */
  next: () => void;
  /** Rewind one step. Never goes below 0. */
  back: () => void;
  /** Dismiss the tour permanently (records `dismissedAt`). */
  skip: () => void;
  /** Close the tour without recording completion or dismissal. */
  close: () => void;
}
