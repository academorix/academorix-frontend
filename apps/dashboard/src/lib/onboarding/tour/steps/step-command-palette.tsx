/**
 * @file step-command-palette.tsx
 * @module onboarding/tour/steps/step-command-palette
 *
 * @description
 * Tour step 2 — anchored to the command palette trigger
 * (`data-testid="command-palette-trigger"`). Copy: "⌘K jumps you
 * anywhere". The step's `ctaKey` is `onboarding.tour.palette.cta`
 * ("Try it") — a live demo hook can be wired later; today the CTA
 * behaves like a normal Next.
 *
 * See {@link "@/lib/onboarding/tour/steps/step-workspace"} for the
 * "why a module per step" rationale.
 *
 * @see onboarding module — Step contents (row 2).
 */

export const STEP_COMMAND_PALETTE_ANCHOR = '[data-testid="command-palette-trigger"]';
