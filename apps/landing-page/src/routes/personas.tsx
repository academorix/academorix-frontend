import { Button, Card } from "@heroui/react";
import { Link as RouterLink, Navigate, useParams } from "react-router";

import { findBySlug, personas, pickL, pickLAll } from "../data/site";
import { useI18n } from "../i18n";
import { CtaSection, Section, SectionHeading } from "../components/marketing/sections";
import { PageHeader } from "../components/marketing/page-header";
import { Iconify } from "../icons/iconify";

export function PersonasRoute() {
  const { t, locale } = useI18n();

  return (
    <>
      <PageHeader
        eyebrow={t("personas.eyebrow")}
        title={t("personas.title")}
        description={t("personas.subtitle")}
      />
      <Section bordered={false}>
        <div className="grid gap-6 md:grid-cols-2">
          {personas.map((persona) => (
            <Card
              key={persona.slug}
              className="group h-full border border-border transition-all duration-300 hover:-translate-y-1 hover:border-accent"
              render={(props) => <RouterLink to={"/for/" + persona.slug} {...(props as object)} />}
            >
              <div className="flex items-center gap-3">
                <div className="flex size-11 items-center justify-center rounded-xl bg-surface-secondary text-foreground transition-colors duration-300 group-hover:bg-accent group-hover:text-accent-foreground">
                  <Iconify className="size-5" icon={persona.icon} />
                </div>
                <div>
                  <Card.Title className="font-display text-lg font-semibold">
                    {pickL(persona.name, locale)}
                  </Card.Title>
                  <p className="text-sm text-muted">{pickL(persona.tagline, locale)}</p>
                </div>
              </div>
              <Card.Content className="mt-4 text-sm leading-relaxed text-muted">
                {pickL(persona.summary, locale)}
              </Card.Content>
            </Card>
          ))}
        </div>
      </Section>
      <CtaSection title={t("personas.ctaTitle")} description={t("personas.ctaDesc")} />
    </>
  );
}

export function PersonaDetailRoute() {
  const { slug } = useParams();
  const { t, locale } = useI18n();
  const persona = findBySlug(personas, slug);

  if (!persona) return <Navigate replace to="/for" />;

  const name = pickL(persona.name, locale);

  return (
    <>
      <PageHeader
        crumbs={[
          { label: t("common.home"), href: "/" },
          { label: t("personas.eyebrow"), href: "/for" },
          { label: name },
        ]}
        eyebrow={pickL(persona.tagline, locale)}
        title={t("personas.detailTitle", { name: name.toLowerCase() })}
        description={pickL(persona.summary, locale)}
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
        <SectionHeading eyebrow={t("personas.dayToDay")} title={t("personas.jobs")} />
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {pickLAll(persona.jobs, locale).map((job) => (
            <Card key={job} className="h-full border border-border">
              <div className="flex size-10 items-center justify-center rounded-xl bg-accent text-accent-foreground">
                <Iconify className="size-5" icon="circle-check" />
              </div>
              <Card.Content className="mt-4 text-base font-medium text-foreground">
                {job}
              </Card.Content>
            </Card>
          ))}
        </div>
      </Section>

      <CtaSection title={t("personas.detailCtaTitle")} description={t("personas.detailCtaDesc")} />
    </>
  );
}
