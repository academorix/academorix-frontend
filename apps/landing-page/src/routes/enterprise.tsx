import { Button, Card } from "@heroui/react";
import { Link as RouterLink } from "react-router";

import { useI18n } from "../i18n";
import { CtaSection, Section, SectionHeading } from "../components/marketing/sections";
import { PageHeader } from "../components/marketing/page-header";
import { Iconify } from "../icons/iconify";

type Capability = {
  icon: string;
  titleKey: string;
  descKey: string;
};

const capabilities: Capability[] = [
  {
    icon: "key",
    titleKey: "enterprise.capabilities.sso.title",
    descKey: "enterprise.capabilities.sso.description",
  },
  {
    icon: "shield-check",
    titleKey: "enterprise.capabilities.permissions.title",
    descKey: "enterprise.capabilities.permissions.description",
  },
  {
    icon: "chart-column",
    titleKey: "enterprise.capabilities.reporting.title",
    descKey: "enterprise.capabilities.reporting.description",
  },
  {
    icon: "gear",
    titleKey: "enterprise.capabilities.onboarding.title",
    descKey: "enterprise.capabilities.onboarding.description",
  },
  {
    icon: "lock",
    titleKey: "enterprise.capabilities.security.title",
    descKey: "enterprise.capabilities.security.description",
  },
  {
    icon: "person",
    titleKey: "enterprise.capabilities.success.title",
    descKey: "enterprise.capabilities.success.description",
  },
];

type Stat = {
  valueKey: string;
  labelKey: string;
};

const stats: Stat[] = [
  { valueKey: "enterprise.stats.uptime.value", labelKey: "enterprise.stats.uptime.label" },
  { valueKey: "enterprise.stats.compliance.value", labelKey: "enterprise.stats.compliance.label" },
  { valueKey: "enterprise.stats.support.value", labelKey: "enterprise.stats.support.label" },
];

export function EnterpriseRoute() {
  const { t } = useI18n();

  return (
    <>
      <PageHeader
        eyebrow={t("enterprise.eyebrow")}
        title={t("enterprise.hero.title")}
        description={t("enterprise.hero.description")}
      >
        <div className="flex flex-wrap gap-3">
          <Button
            render={(props) => <RouterLink to="/contact-sales" {...(props as object)} />}
            variant="primary"
          >
            {t("common.contactSales")}
            <Iconify className="size-4 rtl:rotate-180" icon="arrow-right" />
          </Button>
          <Button
            render={(props) => <RouterLink to="/pricing" {...(props as object)} />}
            variant="outline"
          >
            {t("common.viewPricing")}
          </Button>
        </div>
      </PageHeader>

      <Section bordered={false}>
        <div className="grid gap-6 sm:grid-cols-3">
          {stats.map((stat) => (
            <Card key={stat.labelKey} className="border border-border text-center">
              <p className="font-display text-3xl font-extrabold tracking-tight text-foreground">
                {t(stat.valueKey)}
              </p>
              <p className="mt-1 text-sm text-muted">{t(stat.labelKey)}</p>
            </Card>
          ))}
        </div>
      </Section>

      <Section muted>
        <SectionHeading
          eyebrow={t("enterprise.capabilities.eyebrow")}
          title={t("enterprise.capabilities.title")}
          description={t("enterprise.capabilities.description")}
        />
        <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {capabilities.map((item) => (
            <Card key={item.titleKey} className="h-full border border-border">
              <div className="flex size-10 items-center justify-center rounded-xl bg-accent text-accent-foreground">
                <Iconify className="size-5" icon={item.icon} />
              </div>
              <Card.Header className="mt-4">
                <Card.Title className="font-display text-base font-semibold">
                  {t(item.titleKey)}
                </Card.Title>
                <Card.Description className="mt-1.5 text-sm leading-relaxed text-muted">
                  {t(item.descKey)}
                </Card.Description>
              </Card.Header>
            </Card>
          ))}
        </div>
      </Section>

      <CtaSection
        title={t("enterprise.ctaTitle")}
        description={t("enterprise.ctaDesc")}
        primaryLabel={t("common.contactSales")}
        primaryHref="/contact-sales"
        secondaryLabel={t("common.viewPricing")}
        secondaryHref="/pricing"
      />
    </>
  );
}
