/**
 * @file how-it-works-section.tsx
 * @module components/landing/how-it-works-section
 *
 * @description
 * A four-step "how it works" walkthrough that takes a visitor from sign-up to
 * day-to-day operation. Rendered as an ordered list so the sequence is exposed
 * to assistive technology, with prominent step numerals for quick scanning.
 */

import type { ReactNode } from "react";

import { SectionHeading } from "@/components/landing/section-heading";

/** A single onboarding step. */
interface Step {
  title: string;
  description: string;
}

/** The onboarding steps, in order. */
const STEPS: readonly Step[] = [
  {
    title: "Set up your academy",
    description: "Create branches, seasons, and roles, then tailor terminology to how you work.",
  },
  {
    title: "Add athletes & teams",
    description: "Import your roster or add athletes, then assign them to teams and programs.",
  },
  {
    title: "Run day-to-day",
    description:
      "Schedule sessions, capture attendance, and log performance as the season unfolds.",
  },
  {
    title: "Grow with insight",
    description:
      "Collect payments, manage memberships, and track the numbers that move you forward.",
  },
] as const;

/** The "how it works" section. */
export function HowItWorksSection(): ReactNode {
  return (
    <section
      aria-labelledby="how-it-works-heading"
      className="scroll-mt-24 px-4 py-20 sm:px-6 lg:px-8"
      id="how-it-works"
    >
      <div className="mx-auto max-w-[1400px]">
        <SectionHeading
          description="Go from setup to your first tracked session in an afternoon."
          eyebrow="How it works"
          headingId="how-it-works-heading"
          title="Live in four steps"
        />

        <ol className="mt-14 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((step, index) => (
            <li key={step.title} className="flex flex-col gap-3">
              <span
                aria-hidden="true"
                className="flex size-12 items-center justify-center rounded-2xl bg-accent/10 text-lg font-bold text-accent"
              >
                {String(index + 1).padStart(2, "0")}
              </span>
              <h3 className="text-lg font-semibold text-foreground">
                <span className="sr-only">{`Step ${index + 1}: `}</span>
                {step.title}
              </h3>
              <p className="text-sm text-muted">{step.description}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
