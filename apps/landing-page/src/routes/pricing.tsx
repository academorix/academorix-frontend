import { Button, Card, Chip } from "@heroui/react";
import { Link as RouterLink } from "react-router";

import { faqs, pickL, pickLAll, pricingPlans } from "../data/site";
import { useI18n } from "../i18n";
import { CtaSection, Section, SectionHeading } from "../components/marketing/sections";
import { PageHeader } from "../components/marketing/page-header";
import { Iconify } from "../icons/iconify";

export function PricingRoute() {
  const { t, locale } = useI18n();

  return (
    <>
      <PageHeader
        align="center"
        eyebrow={t("pricing.eyebrow")}
        title={t("pricing.title")}
        description={t("pricing.subtitle")}
      />

      <Section bordered={false}>
        <div className="grid items-stretch gap-6 lg:grid-cols-3">
          {pricingPlans.map((plan) => {
            const planName = pickL(plan.name, locale);
            const cadence = pickL(plan.cadence, locale);

            return (
              <Card
                key={plan.name.en}
                className={
                  "flex h-full flex-col border " +
                  (plan.featured
                    ? "border-accent shadow-[0_24px_50px_-30px_rgba(15,23,42,0.45)]"
                    : "border-border")
                }
              >
                <Card.Header>
                  <div className="flex items-center gap-2">
                    <Card.Title className="font-display text-lg font-semibold">
                      {planName}
                    </Card.Title>
                    {plan.featured ? (
                      <Chip color="accent" size="sm" variant="soft">
                        {t("pricing.featured")}
                      </Chip>
                    ) : null}
                  </div>
                  <Card.Description className="mt-1 text-sm text-muted">
                    {pickL(plan.description, locale)}
                  </Card.Description>
                </Card.Header>
                <Card.Content className="mt-2">
                  <div className="flex items-baseline gap-1">
                    <span className="font-display text-4xl font-extrabold tracking-tight text-foreground">
                      {plan.price}
                    </span>
                    {cadence ? <span className="text-sm text-muted">{cadence}</span> : null}
                  </div>
                  <ul className="mt-6 space-y-3">
                    {pickLAll(plan.features, locale).map((feature) => (
                      <li key={feature} className="flex items-center gap-2.5 text-sm">
                        <Iconify
                          className="size-5 shrink-0 rounded-full bg-accent p-1 text-accent-foreground"
                          icon="check"
                        />
                        <span className="text-foreground">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </Card.Content>
                <Card.Footer className="mt-6">
                  <Button
                    fullWidth
                    render={(props) => <RouterLink to={plan.ctaHref} {...(props as object)} />}
                    variant={plan.featured ? "primary" : "outline"}
                  >
                    {pickL(plan.cta, locale)}
                  </Button>
                </Card.Footer>
              </Card>
            );
          })}
        </div>
      </Section>

      <Section muted>
        <SectionHeading
          align="center"
          eyebrow={t("faqPage.eyebrow")}
          title={t("pricing.faqTitle")}
        />
        <div className="mx-auto mt-10 grid max-w-4xl gap-6 md:grid-cols-2">
          {faqs.slice(0, 4).map((item) => (
            <div key={item.q.en} className="rounded-2xl border border-border bg-surface p-6">
              <p className="font-display text-base font-semibold text-foreground">
                {pickL(item.q, locale)}
              </p>
              <p className="mt-2 text-sm leading-relaxed text-muted">{pickL(item.a, locale)}</p>
            </div>
          ))}
        </div>
      </Section>

      <CtaSection title={t("pricing.ctaTitle")} description={t("pricing.ctaDesc")} />
    </>
  );
}
