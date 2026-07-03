/**
 * @file pricing-section.tsx
 * @module modules/landing/components/pricing-section
 *
 * @description
 * Three-tier pricing (Starter / Pro / Enterprise). The Pro tier is visually
 * promoted with an accent ring and a "Most popular" chip. Every tier's CTA
 * routes to `/login`, matching the rest of the funnel.
 */

import { CheckIcon } from "@academorix/ui/icons/outline";
import { Button, Card, Chip } from "@academorix/ui/react";
import { useNavigate } from "react-router";

import type { ReactNode } from "react";

import { appRoutes } from "@/lib/module";
import { SectionHeading } from "@/modules/landing/components/section-heading";

/** A single pricing tier. */
interface PricingTier {
  /** Tier name (renders as the card title). */
  name: string;
  /** Headline price, e.g. `"$49"` or `"Custom"`. */
  price: string;
  /** Billing cadence suffix, e.g. `"/mo"`; omitted for custom pricing. */
  period?: string;
  /** One-line positioning statement. */
  description: string;
  /** Included capabilities. */
  features: readonly string[];
  /** CTA button label. */
  cta: string;
  /** Whether this tier is promoted as the recommended choice. */
  highlighted?: boolean;
}

/** The pricing tiers, in display order. */
const TIERS: readonly PricingTier[] = [
  {
    name: "Starter",
    price: "$49",
    period: "/mo",
    description: "For a single branch finding its feet.",
    features: ["Up to 100 athletes", "1 branch", "Scheduling & attendance", "Email support"],
    cta: "Choose Starter",
  },
  {
    name: "Pro",
    price: "$149",
    period: "/mo",
    description: "For growing academies with multiple teams.",
    features: [
      "Up to 1,000 athletes",
      "Up to 5 branches",
      "Performance & progress tracking",
      "Payments & memberships",
      "Priority support",
    ],
    cta: "Choose Pro",
    highlighted: true,
  },
  {
    name: "Enterprise",
    price: "Custom",
    description: "For multi-branch networks with advanced needs.",
    features: [
      "Unlimited athletes & branches",
      "SSO & advanced RBAC",
      "Dedicated success manager",
      "Onboarding & SLA",
    ],
    cta: "Contact sales",
  },
] as const;

/**
 * The pricing section.
 */
export function PricingSection(): ReactNode {
  const navigate = useNavigate();

  return (
    <section
      aria-labelledby="pricing-heading"
      className="scroll-mt-24 bg-default/20 px-4 py-20 sm:px-6 lg:px-8"
      id="pricing"
    >
      <div className="mx-auto max-w-7xl">
        <SectionHeading
          description="Straightforward plans that scale with your academy. No hidden fees."
          eyebrow="Pricing"
          headingId="pricing-heading"
          title="Simple, scalable pricing"
        />

        <ul className="mt-14 grid grid-cols-1 gap-6 lg:grid-cols-3">
          {TIERS.map((tier) => (
            <li key={tier.name}>
              <Card
                className={`flex h-full flex-col ${tier.highlighted ? "ring-2 ring-accent" : ""}`}
                variant={tier.highlighted ? "secondary" : "default"}
              >
                <Card.Header>
                  {tier.highlighted ? (
                    <Chip className="self-start" color="accent" size="sm" variant="primary">
                      Most popular
                    </Chip>
                  ) : null}
                  <Card.Title className={tier.highlighted ? "mt-2" : undefined}>
                    {tier.name}
                  </Card.Title>
                  <Card.Description>{tier.description}</Card.Description>
                  <p className="mt-3 flex items-baseline gap-1">
                    <span className="text-4xl font-bold tracking-tight text-foreground">
                      {tier.price}
                    </span>
                    {tier.period ? <span className="text-sm text-muted">{tier.period}</span> : null}
                  </p>
                </Card.Header>

                <Card.Content className="flex-1">
                  <ul className="flex flex-col gap-3">
                    {tier.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-2 text-sm text-foreground">
                        <CheckIcon
                          aria-hidden="true"
                          className="mt-0.5 size-4 shrink-0 text-accent"
                        />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </Card.Content>

                <Card.Footer className="mt-6">
                  <Button
                    className="w-full"
                    variant={tier.highlighted ? "primary" : "outline"}
                    onPress={() => navigate(appRoutes.login)}
                  >
                    {tier.cta}
                  </Button>
                </Card.Footer>
              </Card>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
