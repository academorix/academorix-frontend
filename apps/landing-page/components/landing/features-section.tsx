/**
 * @file features-section.tsx
 * @module components/landing/features-section
 *
 * @description
 * The core capability grid: eight feature cards, each pairing an icon with a
 * title and short description. Covers the platform's headline surfaces —
 * athletes, teams, scheduling, performance (attribute-driven / SDUI), billing,
 * multi-tenancy, RBAC, and Arabic/RTL support.
 */

import {
  ArrowTrendingUpIcon,
  BuildingOffice2Icon,
  CalendarDaysIcon,
  CreditCardIcon,
  LanguageIcon,
  ShieldCheckIcon,
  UserGroupIcon,
  UsersIcon,
} from "@academorix/ui/icons/outline";
import { Card } from "@academorix/ui/react";

import type { IconType } from "@academorix/ui/icons";
import type { ReactNode } from "react";

import { SectionHeading } from "@/components/landing/section-heading";

/** A single capability entry rendered as a feature card. */
interface Feature {
  icon: IconType;
  title: string;
  description: string;
}

/** The eight headline platform capabilities, in display order. */
const FEATURES: readonly Feature[] = [
  {
    icon: UserGroupIcon,
    title: "Athlete management",
    description:
      "Rich profiles, guardians, documents, and enrollment — a single record that follows every athlete.",
  },
  {
    icon: UsersIcon,
    title: "Teams & rosters",
    description:
      "Build squads and age groups, assign coaches, and keep rosters in sync across every program.",
  },
  {
    icon: CalendarDaysIcon,
    title: "Scheduling & attendance",
    description:
      "Plan training and fixtures, then capture attendance in a tap with live session tracking.",
  },
  {
    icon: ArrowTrendingUpIcon,
    title: "Performance & progress",
    description:
      "Sport-specific metrics rendered from configurable attribute sets — no code changes per sport.",
  },
  {
    icon: CreditCardIcon,
    title: "Payments & memberships",
    description:
      "Plans, invoices, and renewals with a clear view of outstanding balances and revenue.",
  },
  {
    icon: BuildingOffice2Icon,
    title: "Multi-branch & multi-tenant",
    description:
      "Run many branches under one tenant, each with isolated data, scope, and reporting.",
  },
  {
    icon: ShieldCheckIcon,
    title: "Role-based access",
    description:
      "Granular, permission-driven roles decide exactly what each coach, admin, or parent can see.",
  },
  {
    icon: LanguageIcon,
    title: "Arabic & RTL",
    description:
      "Full bilingual UI with right-to-left layouts, so your team works in the language they prefer.",
  },
] as const;

/** The features grid section. */
export function FeaturesSection(): ReactNode {
  return (
    <section
      aria-labelledby="features-heading"
      className="scroll-mt-24 px-4 py-20 sm:px-6 lg:px-8"
      id="features"
    >
      <div className="mx-auto max-w-7xl">
        <SectionHeading
          description="One connected platform for every part of academy operations — from the front desk to the field."
          eyebrow="Features"
          headingId="features-heading"
          title="Everything your academy needs"
        />

        <ul className="mt-14 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((feature) => (
            <li key={feature.title}>
              <Card className="h-full">
                <Card.Header>
                  <span className="flex size-11 items-center justify-center rounded-xl bg-accent/10 text-accent">
                    <feature.icon aria-hidden="true" className="size-6" />
                  </span>
                  <Card.Title className="mt-3">{feature.title}</Card.Title>
                  <Card.Description>{feature.description}</Card.Description>
                </Card.Header>
              </Card>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
