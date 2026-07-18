import { Button, Card, Chip } from "@heroui/react";
import { Link as RouterLink, Navigate, useParams } from "react-router";

import { findBySlug, jobs, pickL, pickLAll } from "../data/site";
import { useI18n } from "../i18n";
import { CtaSection, Section, SectionHeading } from "../components/marketing/sections";
import { PageHeader } from "../components/marketing/page-header";
import { Iconify } from "../icons/iconify";

type Value = {
  icon: string;
  titleKey: string;
  descKey: string;
};

const values: Value[] = [
  {
    icon: "heart",
    titleKey: "company.values.coachesFirst.title",
    descKey: "company.values.coachesFirst.description",
  },
  {
    icon: "sliders",
    titleKey: "company.values.simple.title",
    descKey: "company.values.simple.description",
  },
  {
    icon: "shield-check",
    titleKey: "company.values.trust.title",
    descKey: "company.values.trust.description",
  },
  {
    icon: "rocket",
    titleKey: "company.values.ship.title",
    descKey: "company.values.ship.description",
  },
];

type Stat = {
  value: string;
  labelKey: string;
};

const stats: Stat[] = [
  { value: "400+", labelKey: "company.about.stats.academies" },
  { value: "30+", labelKey: "company.about.stats.countries" },
  { value: "1.2M", labelKey: "company.about.stats.sessions" },
  { value: "60", labelKey: "company.about.stats.team" },
];

export function AboutRoute() {
  const { t } = useI18n();

  return (
    <>
      <PageHeader
        eyebrow={t("company.eyebrow")}
        title={t("company.about.title")}
        description={t("company.about.description")}
      />
      <Section bordered={false}>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => (
            <Card key={stat.labelKey} className="border border-border text-center">
              <p className="font-display text-3xl font-extrabold tracking-tight text-foreground">
                {stat.value}
              </p>
              <p className="mt-1 text-sm text-muted">{t(stat.labelKey)}</p>
            </Card>
          ))}
        </div>
      </Section>

      <Section muted>
        <SectionHeading eyebrow={t("company.values.eyebrow")} title={t("company.values.title")} />
        <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {values.map((value) => (
            <Card key={value.titleKey} className="h-full border border-border">
              <div className="flex size-10 items-center justify-center rounded-xl bg-accent text-accent-foreground">
                <Iconify className="size-5" icon={value.icon} />
              </div>
              <Card.Header className="mt-4">
                <Card.Title className="font-display text-base font-semibold">
                  {t(value.titleKey)}
                </Card.Title>
                <Card.Description className="mt-1.5 text-sm leading-relaxed text-muted">
                  {t(value.descKey)}
                </Card.Description>
              </Card.Header>
            </Card>
          ))}
        </div>
      </Section>

      <CtaSection
        title={t("company.about.ctaTitle")}
        description={t("company.about.ctaDesc")}
        primaryLabel={t("company.about.seeRoles")}
        primaryHref="/careers"
        secondaryLabel={t("company.about.contactUs")}
        secondaryHref="/contact-sales"
      />
    </>
  );
}

export function CareersRoute() {
  const { t, locale } = useI18n();

  return (
    <>
      <PageHeader
        eyebrow={t("company.careers.eyebrow")}
        title={t("company.careers.title")}
        description={t("company.careers.subtitle")}
      />
      <Section bordered={false}>
        <div className="mx-auto max-w-3xl space-y-4">
          {jobs.map((job) => (
            <Card
              key={job.slug}
              className="group border border-border transition-all duration-300 hover:border-accent"
              render={(props) => <RouterLink to={"/careers/" + job.slug} {...(props as object)} />}
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <Card.Title className="font-display text-base font-semibold">
                    {pickL(job.title, locale)}
                  </Card.Title>
                  <p className="mt-1 text-sm text-muted">
                    {pickL(job.team, locale)} · {pickL(job.location, locale)}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <Chip size="sm" variant="secondary">
                    {pickL(job.type, locale)}
                  </Chip>
                  <Iconify className="size-4 text-muted rtl:rotate-180" icon="arrow-right" />
                </div>
              </div>
            </Card>
          ))}
        </div>
      </Section>
    </>
  );
}

export function CareerDetailRoute() {
  const { slug } = useParams();
  const { t, locale } = useI18n();
  const job = findBySlug(jobs, slug);

  if (!job) return <Navigate replace to="/careers" />;

  const jobTitle = pickL(job.title, locale);
  const team = pickL(job.team, locale);
  const location = pickL(job.location, locale);
  const type = pickL(job.type, locale);

  return (
    <>
      <PageHeader
        crumbs={[{ label: t("company.careers.eyebrow"), href: "/careers" }, { label: jobTitle }]}
        eyebrow={team + " · " + location + " · " + type}
        title={jobTitle}
        description={pickL(job.description, locale)}
      >
        <Button
          render={(props) => <RouterLink to="/contact-sales" {...(props as object)} />}
          variant="primary"
        >
          {t("company.job.applyNow")}
          <Iconify className="size-4 rtl:rotate-180" icon="arrow-right" />
        </Button>
      </PageHeader>
      <Section bordered={false}>
        <div className="mx-auto grid max-w-3xl gap-10 sm:grid-cols-2">
          <div>
            <h2 className="font-display text-lg font-semibold text-foreground">
              {t("company.job.responsibilities")}
            </h2>
            <ul className="mt-4 space-y-3">
              {pickLAll(job.responsibilities, locale).map((item) => (
                <li key={item} className="flex items-start gap-2.5 text-sm">
                  <Iconify
                    className="mt-0.5 size-4 shrink-0 rounded-full bg-accent p-0.5 text-accent-foreground"
                    icon="check"
                  />
                  <span className="text-foreground">{item}</span>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h2 className="font-display text-lg font-semibold text-foreground">
              {t("company.job.requirements")}
            </h2>
            <ul className="mt-4 space-y-3">
              {pickLAll(job.requirements, locale).map((item) => (
                <li key={item} className="flex items-start gap-2.5 text-sm">
                  <Iconify
                    className="mt-0.5 size-4 shrink-0 rounded-full bg-accent p-0.5 text-accent-foreground"
                    icon="check"
                  />
                  <span className="text-foreground">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Section>
    </>
  );
}

type PressItem = {
  titleKey: string;
  sourceKey: string;
  dateKey: string;
};

const press: PressItem[] = [
  {
    titleKey: "company.press.item1.title",
    sourceKey: "company.press.item1.source",
    dateKey: "company.press.item1.date",
  },
  {
    titleKey: "company.press.item2.title",
    sourceKey: "company.press.item2.source",
    dateKey: "company.press.item2.date",
  },
  {
    titleKey: "company.press.item3.title",
    sourceKey: "company.press.item3.source",
    dateKey: "company.press.item3.date",
  },
];

export function PressRoute() {
  const { t } = useI18n();

  return (
    <>
      <PageHeader
        eyebrow={t("company.press.eyebrow")}
        title={t("company.press.title")}
        description={t("company.press.subtitle")}
      />
      <Section bordered={false}>
        <div className="mx-auto max-w-3xl space-y-4">
          {press.map((item) => (
            <Card key={item.titleKey} className="border border-border">
              <div className="flex flex-wrap items-center gap-3">
                <Chip size="sm" variant="secondary">
                  {t(item.sourceKey)}
                </Chip>
                <span className="text-xs text-muted">{t(item.dateKey)}</span>
              </div>
              <Card.Title className="font-display mt-2 text-base font-semibold">
                {t(item.titleKey)}
              </Card.Title>
            </Card>
          ))}
        </div>
        <div className="mx-auto mt-8 flex max-w-3xl flex-col items-start gap-3 rounded-2xl border border-border p-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-display text-base font-semibold text-foreground">
              {t("company.press.mediaKit.title")}
            </p>
            <p className="text-sm text-muted">{t("company.press.mediaKit.desc")}</p>
          </div>
          <Button
            render={(props) => <RouterLink to="/contact-sales" {...(props as object)} />}
            variant="outline"
          >
            {t("company.press.mediaKit.cta")}
          </Button>
        </div>
      </Section>
    </>
  );
}
