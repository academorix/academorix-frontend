/**
 * @file index.ts
 * @module onboarding
 *
 * @description
 * Public barrel for the onboarding subsystem. Consumers should import
 * from `@/lib/onboarding` (never reach into individual files) so we can
 * refactor internals without moving import lines.
 *
 * The five pieces surfaced here:
 *
 *  1. **Types** — surface + storage shapes.
 *  2. **Surface detection** — `useSurface()` hook + `resolveSurface()`
 *     for non-React callers.
 *  3. **Typed storage** — per-slot read/write with schema validation.
 *  4. **Cloud state** — opportunistic sync to the backend
 *     (Phase 2 — TODO'd endpoint).
 *  5. **Tour + checklist runtime** — the `<TourProvider>` mount, the
 *     `useTour()` hook, the checklist widget, and the `restartTour()`
 *     imperative entry the Help menu wires to.
 *
 * The Menus / Notifications / Desktop sub-agents consume this barrel
 * for their handoff points — DO NOT expose internals through side
 * modules.
 */

// -- Types --
export type {
  ChecklistStorageState,
  CloudOnboardingState,
  DesktopStorageState,
  OnboardingChecklistTask,
  OnboardingSurface,
  OnboardingTourStep,
  PwaStorageState,
  TourActions,
  TourRuntimeState,
  TourStorageState,
} from "@/lib/onboarding/onboarding.types";

export {
  DEFAULT_CHECKLIST_STATE,
  DEFAULT_DESKTOP_STATE,
  DEFAULT_PWA_STATE,
  DEFAULT_TOUR_STATE,
} from "@/lib/onboarding/onboarding.types";

// -- Surface detection --
export { detectSurface, readSurfaceInput } from "@/lib/onboarding/detect-surface";
export type { DetectSurfaceInput } from "@/lib/onboarding/detect-surface";
export { resolveSurface, useSurface } from "@/lib/onboarding/use-surface";

// -- Typed storage --
export {
  clearOnboardingState,
  readChecklistState,
  readDesktopState,
  readPwaState,
  readTourState,
  writeChecklistState,
  writeDesktopState,
  writePwaState,
  writeTourState,
} from "@/lib/onboarding/storage";

// -- Tour runtime --
export { TourProvider, restartTour, useTour } from "@/lib/onboarding/tour/tour-provider";
export { emitOnboardingEvent } from "@/lib/onboarding/tour/tour-analytics";
export type { OnboardingEventProps } from "@/lib/onboarding/tour/tour-analytics";

// -- PWA welcome toast --
// Rendered by `<TourProvider>`; also exported so a future refactor that
// mounts the toast next to `<PwaUpdateToast>` (rather than inside the
// tour provider) can pull it in without a follow-up change.
export { PwaWelcomeToast } from "@/lib/onboarding/pwa-welcome-toast";

// -- Cloud state sync --
// One-shot backend sync of the onboarding state. See `cloud-state.ts`
// for the TODO(backend-endpoint) contract.
export {
  applyCloudOnboardingState,
  collectLocalOnboardingState,
  syncOnboardingStateOnce,
  useCloudOnboardingSync,
} from "@/lib/onboarding/cloud-state";
