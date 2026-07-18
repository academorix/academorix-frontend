import { Button, Card } from "@heroui/react";
import { Link as RouterLink, Navigate, useParams } from "react-router";

import { findBySlug, pickL, pickLAll, solutions } from "../data/site";
import { useI18n } from "../i18n";
import { CtaSection, Section, SectionHeading } from "../components/marketing/sections";
import { PageHeader } from "../components/marketing/page-header";
import { Iconify } from "../icons/iconify";

export function SolutionsRoute() {
  const { t, locale } = useI18n();

  return (
    <>
      <PageHeader
        eyebrow={t("solutions.eyebrow")}
        title={t("solutions.title")}
        description={t("solutions.subtitle")}
      />
      <Section bordered={false}>
        <div className="grid gap-6 md:grid-cols-2">
          {solutions.map((solution) => (
            <Card
              key={solution.slug}
              className="group h-full border border-border transition-all duration-300 hover:-translate-y-1 hover:border-accent"
              render={(props) => (
                <RouterLink to={"/solutions/" + solution.slug} {...(props as object)} />
              )}
            >
              <div className="flex items-center gap-3">
                <div className="flex size-11 items-center justify-center rounded-xl bg-surface-secondary text-foreground transition-colors duration-300 group-hover:bg-accent group-hover:text-accent-foreground">
                  <Iconify className="size-5" icon={solution.icon} />
                </div>
                <div>
                  <Card.Title className="font-display text-lg font-semibold">
                    {pickL(solution.name, locale)}
                  </Card.Title>
                  <p className="text-sm text-muted">{pickL(solution.tagline, locale)}</p>
                </div>
              </div>
              <Card.Content className="mt-4 text-sm leading-relaxed text-muted">
                {pickL(solution.summary, locale)}
              </Card.Content>
            </Card>
          ))}
        </div>
      </Section>
      <CtaSection
        title={t("solutions.ctaTitle")}
        description={t("solutions.ctaDesc")}
        primaryLabel={t("common.contactSales")}
        primaryHref="/contact-sales"
      />
    </>
  );
}

export function SolutionDetailRoute() {
  const { slug } = useParams();
  const { t, locale } = useI18n();
  const solution = findBySlug(solutions, slug);

  if (!solution) return <Navigate replace to="/solutions" />;

  const name = pickL(solution.name, locale);

  return (
    <>
      <PageHeader
        crumbs={[
          { label: t("common.home"), href: "/" },
          { label: t("solutions.eyebrow"), href: "/solutions" },
          { label: name },
        ]}
        eyebrow={pickL(solution.tagline, locale)}
        title={name}
        description={pickL(solution.summary, locale)}
      >
        <Button
          render={(props) => <RouterLink to="/create-workspace" {...(props as object)} />}
          variant="primary"
        >
          {t("common.startFreeTrial")}
          <Iconify className="size-4 rtl:rotate-180" icon="arrow-right" />
        </Button>
      </PageHeader>

      <Section bordered={false}>
        <SectionHeading eyebrow={t("solutions.outcomes")} title={t("solutions.whatToExpect")} />
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {pickLAll(solution.outcomes, locale).map((outcome) => (
            <Card key={outcome} className="h-full border border-border">
              <div className="flex size-10 items-center justify-center rounded-xl bg-accent text-accent-foreground">
                <Iconify className="size-5" icon="circle-check" />
              </div>
              <Card.Content className="mt-4 text-base font-medium text-foreground">
                {outcome}
              </Card.Content>
            </Card>
          ))}
        </div>
      </Section>

      <CtaSection
        title={t("solutions.detailCtaTitle")}
        description={t("solutions.detailCtaDesc")}
        primaryLabel={t("common.contactSales")}
        primaryHref="/contact-sales"
      />
    </>
  );
}
