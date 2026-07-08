/**
 * @file step-workspace.tsx
 * @module onboarding/tour/steps/step-workspace
 *
 * @description
 * Tour step 1 — anchored to the sidebar Athletes group
 * (`data-testid="sidebar-athletes"`). Copy: "Everything is a
 * workspace".
 *
 * The step's rendering is owned by the shared {@link TourPopover}
 * shell; this file exists to give each step a stable module
 * identity + colocate the surface-specific docblock. When a step
 * needs bespoke chrome (a custom hero image, a live preview), it
 * can grow a real component here and the shell can consume it via
 * a `component?: OnboardingTourStep['component']` extension.
 *
 * For Phase 1 all four web steps are chrome-identical — the shell
 * reads the title / body keys from
 * {@link "@/config/onboarding.config".TOUR_STEPS} and renders the
 * same popover for each.
 *
 * @see onboarding module — Step contents (row 1).
 */

/** Anchor selector referenced by the tour config. Kept as a shared string. */
export const STEP_WORKSPACE_ANCHOR = '[data-testid="sidebar-athletes"]';
