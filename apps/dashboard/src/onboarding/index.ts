/**
 * @file index.ts
 * @module onboarding
 *
 * @description
 * Public barrel for the onboarding subsystem. Consumers should import
 * from `@/onboarding` (never reach into individual files) so we can
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
} from "@/onboarding/onboarding.types";

export {
  DEFAULT_CHECKLIST_STATE,
  DEFAULT_DESKTOP_STATE,
  DEFAULT_PWA_STATE,
  DEFAULT_TOUR_STATE,
} from "@/onboarding/onboarding.types";

// -- Surface detection --
export { detectSurface, readSurfaceInput } from "@/onboarding/detect-surface";
export type { DetectSurfaceInput } from "@/onboarding/detect-surface";
export { resolveSurface, useSurface } from "@/onboarding/use-surface";

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
} from "@/onboarding/storage";
