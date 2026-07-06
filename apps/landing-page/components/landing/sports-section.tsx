/**
 * @file sports-section.tsx
 * @module components/landing/sports-section
 *
 * @description
 * Showcases the sports the platform runs today and, more importantly, that the
 * engine is sport-agnostic: sport-specific fields come from configurable
 * attribute sets (server-driven UI), so a new discipline is a configuration
 * change — not a code change.
 */

import { AdjustmentsHorizontalIcon, PlusIcon } from "@academorix/ui/icons/outline";
import { Card, Chip } from "@academorix/ui/react";

import type { ReactNode } from "react";

import { SectionHeading } from "@/components/landing/section-heading";

/** Sports currently supported out of the box, in display order. */
const SPORTS: readonly string[] = [
  "Football",
  "Swimming",
  "Basketball",
  "Tennis",
  "Martial Arts",
  "Gymnastics",
] as const;

/** Short proof points for the sport-agnostic engine. */
const ENGINE_POINTS: readonly string[] = [
  "Sport-specific fields defined as attribute sets, not hardcoded columns",
  "Bilingual, RTL-ready labels rendered from the same schema",
  "Versioned schemas so historical records stay accurate",
] as const;

/** The sports showcase section. */
export function SportsSection(): ReactNode {
  return (
    <section
      aria-labelledby="sports-heading"
      className="scroll-mt-24 bg-default/20 px-4 py-20 sm:px-6 lg:px-8"
      id="sports"
    >
      <div className="mx-auto max-w-[1400px]">
        <SectionHeading
          description="Start with the sports below, or configure your own. The engine adapts to the discipline — you don't adapt to the tool."
          eyebrow="Sports"
          headingId="sports-heading"
          title="One engine, every sport"
        />

        <div className="mt-12 grid grid-cols-1 gap-8 lg:grid-cols-2 lg:items-center">
          {/* Supported sports as chips */}
          <ul className="flex flex-wrap justify-center gap-3 lg:justify-start">
            {SPORTS.map((sport) => (
              <li key={sport}>
                <Chip size="lg" variant="secondary">
                  {sport}
                </Chip>
              </li>
            ))}
            <li>
              <Chip color="accent" size="lg" variant="soft">
                <PlusIcon aria-hidden="true" className="size-3.5" />
                <Chip.Label>Your sport</Chip.Label>
              </Chip>
            </li>
          </ul>

          {/* Sport-agnostic engine emphasis */}
          <Card variant="secondary">
            <Card.Header>
              <span className="flex size-11 items-center justify-center rounded-xl bg-accent/10 text-accent">
                <AdjustmentsHorizontalIcon aria-hidden="true" className="size-6" />
              </span>
              <Card.Title className="mt-3">Sport-agnostic by design</Card.Title>
              <Card.Description>
                Every sport-variable field is configuration. Add a discipline, tune its metrics, and
                the right forms and views appear — no rebuild required.
              </Card.Description>
            </Card.Header>
            <Card.Content>
              <ul className="flex flex-col gap-3">
                {ENGINE_POINTS.map((point) => (
                  <li key={point} className="flex items-start gap-2 text-sm text-muted">
                    <span
                      aria-hidden="true"
                      className="mt-2 size-1.5 shrink-0 rounded-full bg-accent"
                    />
                    {point}
                  </li>
                ))}
              </ul>
            </Card.Content>
          </Card>
        </div>
      </div>
    </section>
  );
}
