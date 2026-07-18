import { Avatar, Button, Card } from "@heroui/react";
import { Link as RouterLink } from "react-router";

import { useI18n } from "../i18n";
import { CtaSection, Section, SectionHeading } from "../components/marketing/sections";
import { PageHeader } from "../components/marketing/page-header";
import { Iconify } from "../icons/iconify";

type Feature = { icon: string; titleKey: string; descKey: string };

const features: Feature[] = [
  {
    icon: "chart-line",
    titleKey: "aiEngine.features.predictive.title",
    descKey: "aiEngine.features.predictive.description",
  },
  {
    icon: "sparkles",
    titleKey: "aiEngine.features.insight.title",
    descKey: "aiEngine.features.insight.description",
  },
  {
    icon: "thunderbolt",
    titleKey: "aiEngine.features.automation.title",
    descKey: "aiEngine.features.automation.description",
  },
];

type Step = { icon: string; titleKey: string; descKey: string };

const steps: Step[] = [
  {
    icon: "magic-wand",
    titleKey: "aiEngine.how.step1.title",
    descKey: "aiEngine.how.step1.description",
  },
  {
    icon: "chart-line-arrow-up",
    titleKey: "aiEngine.how.step2.title",
    descKey: "aiEngine.how.step2.description",
  },
];

export function AiEngineRoute() {
  const { t } = useI18n();

  return (
    <>
      <PageHeader
        crumbs={[
          { label: t("common.home"), href: "/" },
          { label: t("products.eyebrow"), href: "/products" },
          { label: t("aiEngine.eyebrow") },
        ]}
        eyebrow={t("aiEngine.eyebrow")}
        title={t("aiEngine.title")}
        description={t("aiEngine.subtitle")}
      >
        <div className="flex flex-wrap gap-3">
          <Button
            render={(props) => <RouterLink to="/create-workspace" {...(props as object)} />}
            variant="primary"
          >
            {t("common.startFreeTrial")}
            <Iconify className="size-4 rtl:rotate-180" icon="arrow-right" />
          </Button>
          <Button
            render={(props) => <RouterLink to="/contact-sales" {...(props as object)} />}
            variant="outline"
          >
            {t("common.bookDemo")}
          </Button>
        </div>
      </PageHeader>

      <Section bordered={false}>
        <SectionHeading
          eyebrow={t("aiEngine.features.eyebrow")}
          title={t("aiEngine.features.title")}
        />
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {features.map((feature) => (
            <Card key={feature.titleKey} className="h-full border border-border">
              <div className="flex size-10 items-center justify-center rounded-xl bg-accent text-accent-foreground">
                <Iconify className="size-5" icon={feature.icon} />
              </div>
              <Card.Header className="mt-4">
                <Card.Title className="font-display text-base font-semibold">
                  {t(feature.titleKey)}
                </Card.Title>
                <Card.Description className="mt-1.5 text-sm leading-relaxed text-muted">
                  {t(feature.descKey)}
                </Card.Description>
              </Card.Header>
            </Card>
          ))}
        </div>
      </Section>

      <Section muted>
        <SectionHeading eyebrow={t("aiEngine.how.eyebrow")} title={t("aiEngine.how.title")} />
        <div className="mt-10 grid gap-6 md:grid-cols-2">
          {steps.map((step, index) => (
            <div
              key={step.titleKey}
              className="relative rounded-2xl border border-border bg-surface p-6"
            >
              <span className="font-display flex size-9 items-center justify-center rounded-full bg-accent text-sm font-bold text-accent-foreground">
                {index + 1}
              </span>
              <div className="mt-4 flex items-start gap-3">
                <Iconify
                  className="size-9 rounded-xl bg-accent p-2 text-accent-foreground"
                  icon={step.icon}
                />
                <div>
                  <p className="font-display text-base font-semibold text-foreground">
                    {t(step.titleKey)}
                  </p>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted">{t(step.descKey)}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Section>

      <Section bordered={false}>
        <figure className="mx-auto max-w-3xl rounded-3xl border border-border bg-surface p-8 text-center sm:p-10">
          <blockquote className="font-display text-2xl leading-snug font-semibold tracking-tight text-foreground">
            &ldquo;{t("aiEngine.testimonial.quote")}&rdquo;
          </blockquote>
          <figcaption className="mt-6 flex items-center justify-center gap-3">
            <Avatar className="bg-accent/15 text-accent">
              <Avatar.Fallback>EM</Avatar.Fallback>
            </Avatar>
            <div className="text-start">
              <p className="text-sm font-semibold text-foreground">
                {t("aiEngine.testimonial.author")}
              </p>
              <p className="text-sm text-muted">{t("aiEngine.testimonial.role")}</p>
            </div>
          </figcaption>
        </figure>
      </Section>

      <CtaSection title={t("aiEngine.cta.title")} description={t("aiEngine.cta.description")} />
    </>
  );
}
