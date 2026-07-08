/**
 * @file step-desktop-preface.tsx
 * @module onboarding/tour/steps/step-desktop-preface
 *
 * @description
 * Desktop-only tour step 0 preface — anchored to the tray icon
 * (`data-testid="app-tray-icon"`, exposed by the Desktop sub-agent
 * once tray wiring lands). Falls back to a centered spotlight
 * dialog when the anchor is absent (currently the case in dev).
 *
 * Copy: "We live in the menu bar too. Click here for quick
 * actions."
 *
 * @see onboarding module — Desktop first-run.
 */

export const STEP_DESKTOP_PREFACE_ANCHOR = '[data-testid="app-tray-icon"]';
