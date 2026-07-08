/**
 * @file step-pwa-preface.tsx
 * @module onboarding/tour/steps/step-pwa-preface
 *
 * @description
 * PWA-only tour step 0 preface. Renders centered (no anchor) — the
 * message is contextual to the whole app, not a specific chrome
 * element. Copy: "You're using the installed app — it caches
 * offline and gets automatic updates."
 *
 * @see onboarding module — PWA first-run.
 */

/**
 * Marker: no anchor selector because this step renders centered.
 * The tour popover shell reads this as "no anchor" and skips the
 * bounding-rect measurement.
 */
export const STEP_PWA_PREFACE_ANCHOR: string | undefined = undefined;
