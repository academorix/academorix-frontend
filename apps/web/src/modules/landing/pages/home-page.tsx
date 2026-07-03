/**
 * @file home-page.tsx
 * @module modules/landing/pages/home-page
 *
 * @description
 * Public marketing landing page (the `/` route). Rendered inside `<Refine>` but
 * requires no data — it's the one screen unauthenticated visitors always see.
 *
 * The page is a thin composition of section subcomponents living in
 * `modules/landing/components/`; each section owns its own content and markup.
 * The root wrapper carries the theme surface (`bg-background text-foreground`)
 * and an `id="top"` anchor target for "back to top" footer links, and the
 * semantic landmarks (`<header>`, `<main>`, `<footer>`) come from the sections
 * themselves so screen-reader navigation is well structured.
 */

import type { ReactNode } from "react";

import { CtaSection } from "@/modules/landing/components/cta-section";
import { FeaturesSection } from "@/modules/landing/components/features-section";
import { FooterSection } from "@/modules/landing/components/footer-section";
import { HeroSection } from "@/modules/landing/components/hero-section";
import { HowItWorksSection } from "@/modules/landing/components/how-it-works-section";
import { LandingHeader } from "@/modules/landing/components/landing-header";
import { LogoStrip } from "@/modules/landing/components/logo-strip";
import { PricingSection } from "@/modules/landing/components/pricing-section";
import { SportsSection } from "@/modules/landing/components/sports-section";
import { TestimonialsSection } from "@/modules/landing/components/testimonials-section";

/** The public landing page, composed from the landing section subcomponents. */
export default function HomePage(): ReactNode {
  return (
    <div className="flex min-h-dvh flex-col bg-background text-foreground" id="top">
      <LandingHeader />

      <main className="flex-1">
        <HeroSection />
        <LogoStrip />
        <FeaturesSection />
        <SportsSection />
        <HowItWorksSection />
        <PricingSection />
        <TestimonialsSection />
        <CtaSection />
      </main>

      <FooterSection />
    </div>
  );
}
