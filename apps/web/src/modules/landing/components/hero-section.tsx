/**
 * @file hero-section.tsx
 * @module modules/landing/components/hero-section
 *
 * @description
 * The above-the-fold hero: an eyebrow badge, the primary headline and subhead,
 * two calls-to-action ("Get started" → `/login`; "Explore features" → in-page
 * anchor), and a compact stat row that signals scale at a glance.
 */

import { ArrowRightIcon, SparklesIcon } from "@academorix/ui/icons/outline";
import { Button, Chip } from "@academorix/ui/react";
import { useNavigate } from "react-router";

import type { ReactNode } from "react";

import { siteConfig } from "@/config/site";
import { appRoutes } from "@/lib/module";

/** A single headline metric shown in the hero stat row. */
interface HeroStat {
  /** The emphasised figure, e.g. `"50k+"`. */
  value: string;
  /** What the figure counts, e.g. `"Athletes managed"`. */
  label: string;
}

/** Social-proof figures rendered beneath the hero CTAs. */
const HERO_STATS: readonly HeroStat[] = [
  { value: "200+", label: "Academies onboard" },
  { value: "50k+", label: "Athletes managed" },
  { value: "12", label: "Sports supported" },
] as const;

/**
 * The landing-page hero section.
 *
 * Contains the page's single `<h1>` and the primary conversion actions.
 */
export function HeroSection(): ReactNode {
  const navigate = useNavigate();

  return (
    <section
      aria-labelledby="hero-heading"
      className="relative overflow-hidden px-4 pt-16 pb-12 sm:px-6 sm:pt-24 lg:px-8 lg:pt-28"
    >
      {/* Soft ambient backdrop — purely decorative. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[420px] bg-gradient-to-b from-accent/10 to-transparent"
      />

      <div className="mx-auto flex max-w-3xl flex-col items-center text-center">
        <Chip color="accent" variant="soft">
          <SparklesIcon aria-hidden="true" className="size-3.5" />
          <Chip.Label>The multi-sport academy OS</Chip.Label>
        </Chip>

        <h1
          className="mt-6 text-4xl font-semibold tracking-tight text-balance text-foreground sm:text-5xl lg:text-6xl"
          id="hero-heading"
        >
          Run your entire sports academy from one place
        </h1>

        <p className="mt-6 max-w-2xl text-lg text-pretty text-muted sm:text-xl">
          {siteConfig.name} brings athletes, teams, scheduling, performance, payments, and
          multi-branch operations together — one platform that adapts to any sport, any language.
        </p>

        <div className="mt-9 flex w-full flex-col items-center justify-center gap-3 sm:flex-row">
          <Button
            className="w-full sm:w-auto"
            size="lg"
            variant="primary"
            onPress={() => navigate(appRoutes.login)}
          >
            Get started
            <ArrowRightIcon aria-hidden="true" className="size-4" />
          </Button>

          {/* Secondary CTA is a real in-page anchor, styled to match the button set. */}
          <a
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-default px-6 py-3 text-sm font-medium text-foreground transition-colors hover:bg-default/40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent sm:w-auto"
            href="#features"
          >
            Explore features
          </a>
        </div>

        <dl className="mt-14 grid w-full grid-cols-1 gap-6 sm:grid-cols-3">
          {HERO_STATS.map((stat) => (
            <div key={stat.label} className="flex flex-col items-center gap-1">
              <dt className="order-2 text-sm text-muted">{stat.label}</dt>
              <dd className="order-1 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                {stat.value}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
