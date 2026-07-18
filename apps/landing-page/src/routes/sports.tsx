import type { CSSProperties } from "react";

import { Avatar, Button, Card, Chip } from "@heroui/react";
import { motion, useReducedMotion } from "motion/react";
import { Link as RouterLink, Navigate, useParams } from "react-router";

import { pickL, sports } from "../data/site";
import { pick, pickAll, sportProfiles } from "../data/sports";
import { useI18n } from "../i18n";
import { CtaSection, Section, SectionHeading } from "../components/marketing/sections";
import { PageHeader } from "../components/marketing/page-header";
import { SportVector } from "../components/marketing/sport-vectors";
import { Seo, SITE_URL } from "../components/seo";
import { Iconify } from "../icons/iconify";

/**
 * Sports whose accent CSS token is bright enough that white foreground text
 * would fail contrast — swap in a dark accent-foreground so the sport-detail
 * hero remains readable on both dark and light themes.
 */
const brightAccentSports = new Set(["tennis"]);

/**
 * Resolve a sport's `sports` entry (from site.ts) by slug. The array carries
 * per-sport metrics + a translated display name that the route uses in
 * `Seo`, breadcrumb JSON-LD, and the "explore other sports" grid.
 */
function findSport(slug: string | undefined) {
  return sports.find((sport) => sport.slug === slug);
}

export function SportsRoute() {
  const { t, locale } = useI18n();

  return (
    <>
      <Seo description={t("sportsIndex.subtitle")} path="/sports" title={t("sports.title")} />
      <PageHeader
        eyebrow={t("nav.sports")}
        title={t("sports.title")}
        description={t("sports.subtitle")}
      />
      <Section bordered={false}>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {sports.map((sport) => {
            const profile = sportProfiles[sport.slug];
            const sportName = pickL(sport.name, locale);

            return (
              <Card
                key={sport.slug}
                className="group h-full overflow-hidden border border-border p-0 transition-all duration-300 hover:-translate-y-1 hover:border-accent"
                render={(props) => (
                  <RouterLink to={"/sports/" + sport.slug} {...(props as object)} />
                )}
              >
                {profile ? (
                  <div className="relative h-28">
                    <SportVector
                      accent={profile.accent}
                      className="size-full rounded-none"
                      kind={profile.vector}
                    />
                    <div className="absolute bottom-3 left-4 flex items-center gap-2 text-white">
                      <Iconify className="size-5" icon={sport.icon} />
                      <span className="font-display text-lg font-semibold">{sportName}</span>
                    </div>
                  </div>
                ) : null}
                <div className="p-5">
                  <p className="text-sm leading-relaxed text-muted">{pickL(sport.blurb, locale)}</p>
                  <span className="mt-4 flex flex-row items-center gap-1 text-sm font-semibold text-foreground">
                    {t("common.learnMore")}
                    <Iconify className="size-4 rtl:rotate-180" icon="arrow-right" />
                  </span>
                </div>
              </Card>
            );
          })}
        </div>
      </Section>
      <CtaSection
        title={t("sportsIndex.dontSeeYours")}
        description={t("sportsIndex.dontSeeYoursDesc")}
        primaryLabel={t("common.contactSales")}
        primaryHref="/contact-sales"
      />
    </>
  );
}

export function SportDetailRoute() {
  const { slug } = useParams();
  const { t, locale } = useI18n();
  const reduceMotion = useReducedMotion();
  const sport = findSport(slug);
  const profile = slug ? sportProfiles[slug] : undefined;

  if (!sport || !profile) return <Navigate replace to="/sports" />;

  const sportName = pickL(sport.name, locale);
  const heroDescription = pick(profile.heroDescription, locale);
  const environment = pick(profile.environment, locale);
  const tagline = pick(profile.tagline, locale);
  const heroTitle = pick(profile.heroTitle, locale);
  const highlights = pickAll(profile.highlights, locale);

  const accentFg = brightAccentSports.has(profile.slug)
    ? "oklch(0.24 0.04 155)"
    : "oklch(0.98 0 0)";

  const themeStyle = {
    "--accent": profile.accent,
    "--accent-hover": profile.accent,
    "--accent-foreground": accentFg,
  } as CSSProperties;

  const fade = (delay: number) =>
    reduceMotion
      ? {}
      : {
          initial: { opacity: 0, y: 18 },
          animate: { opacity: 1, y: 0 },
          transition: { duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] as const },
        };

  const otherSports = sports.filter((item) => item.slug !== sport.slug).slice(0, 5);

  // JSON-LD stays in English regardless of locale — search engines index the
  // canonical English shape. If you want per-locale schema later, thread
  // locale through here.
  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL + "/" },
        { "@type": "ListItem", position: 2, name: "Sports", item: SITE_URL + "/sports" },
        {
          "@type": "ListItem",
          position: 3,
          name: sport.name.en,
          item: SITE_URL + "/sports/" + sport.slug,
        },
      ],
    },
    {
      "@context": "https://schema.org",
      "@type": "Service",
      name: "Academorix for " + sport.name.en,
      serviceType: sport.name.en + " academy management software",
      provider: { "@type": "Organization", name: "Academorix" },
      description: profile.heroDescription.en,
    },
  ];

  return (
    <div style={themeStyle}>
      <Seo
        description={heroDescription}
        jsonLd={jsonLd}
        path={"/sports/" + sport.slug}
        title={sportName + " · " + t("nav.products")}
      />

      <section className="border-b border-separator">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-5 pt-12 pb-14 sm:px-6 lg:grid-cols-[1.05fr_1fr] lg:pt-16 lg:pb-20">
          <motion.div {...fade(0)}>
            <Chip className="bg-accent text-accent-foreground" size="sm" variant="soft">
              <Iconify className="size-3.5" icon={sport.icon} />
              {tagline}
            </Chip>
            <h1 className="font-display mt-5 text-4xl leading-[1.05] font-extrabold tracking-tight text-foreground sm:text-5xl">
              {heroTitle}
            </h1>
            <p className="mt-5 text-lg leading-relaxed text-muted">{heroDescription}</p>

            <div className="mt-7 flex flex-wrap gap-3">
              <Button
                render={(props) => <RouterLink to="/create-workspace" {...(props as object)} />}
                size="lg"
                variant="primary"
              >
                {t("common.startFreeTrial")}
                <Iconify className="size-4 rtl:rotate-180" icon="arrow-right" />
              </Button>
              <Button
                render={(props) => <RouterLink to="/contact-sales" {...(props as object)} />}
                size="lg"
                variant="outline"
              >
                {t("common.bookDemo")}
              </Button>
            </div>

            <div className="mt-7 flex flex-wrap gap-2">
              {highlights.map((item) => (
                <span
                  key={item}
                  className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1 text-xs font-medium text-muted"
                >
                  <Iconify className="size-3.5 text-accent" icon="circle-check-fill" />
                  {item}
                </span>
              ))}
            </div>
          </motion.div>

          <motion.div
            {...(reduceMotion
              ? {}
              : {
                  initial: { opacity: 0, scale: 0.97 },
                  animate: { opacity: 1, scale: 1 },
                  transition: { duration: 0.6, delay: 0.1, ease: [0.22, 1, 0.36, 1] as const },
                })}
          >
            <div className="relative">
              <SportVector
                accent={profile.accent}
                className="aspect-[4/3] w-full shadow-[0_30px_60px_-30px_rgba(15,23,42,0.5)]"
                kind={profile.vector}
              />
              <div className="absolute inset-x-4 bottom-4 flex items-center justify-between rounded-2xl bg-black/35 px-4 py-3 text-white backdrop-blur-md">
                <span className="text-sm font-semibold">{sportName}</span>
                <span className="text-xs text-white/80">{environment}</span>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <Section bordered={false}>
        <div className="grid gap-6 sm:grid-cols-3">
          {sport.metrics.map((metric) => (
            <Card key={metric.value} className="border border-border text-center">
              <p className="font-display text-3xl font-extrabold tracking-tight text-foreground">
                {metric.value}
              </p>
              <p className="mt-1 text-sm text-muted">{pickL(metric.label, locale)}</p>
            </Card>
          ))}
        </div>
      </Section>

      <Section muted>
        <SectionHeading
          eyebrow={t("sports.showcase")}
          title={t("sports.purposeBuilt", { sport: sportName })}
          description={t("sports.purposeBuiltDesc")}
        />
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {profile.showcase.map((item) => (
            <Card key={item.title.en} className="h-full border border-border">
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-xl bg-accent text-accent-foreground">
                  <Iconify className="size-5" icon={item.icon} />
                </div>
                <Chip size="sm" variant="secondary">
                  {pick(item.tag, locale)}
                </Chip>
              </div>
              <Card.Header className="mt-4">
                <Card.Title className="font-display text-base font-semibold">
                  {pick(item.title, locale)}
                </Card.Title>
                <Card.Description className="mt-1.5 text-sm leading-relaxed text-muted">
                  {pick(item.description, locale)}
                </Card.Description>
              </Card.Header>
            </Card>
          ))}
        </div>
      </Section>

      <Section bordered={false}>
        <SectionHeading
          eyebrow={t("sports.capabilities")}
          title={t("sports.whatAcademiesGet", { sport: sportName })}
        />
        <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {profile.features.map((feature) => (
            <Card key={feature.title.en} className="h-full border border-border">
              <div className="flex size-10 items-center justify-center rounded-xl bg-accent/15 text-accent">
                <Iconify className="size-5" icon={feature.icon} />
              </div>
              <Card.Header className="mt-4">
                <Card.Title className="font-display text-base font-semibold">
                  {pick(feature.title, locale)}
                </Card.Title>
                <Card.Description className="mt-1.5 text-sm leading-relaxed text-muted">
                  {pick(feature.description, locale)}
                </Card.Description>
              </Card.Header>
            </Card>
          ))}
        </div>
      </Section>

      <Section muted>
        <SectionHeading
          align="center"
          eyebrow={t("sports.workflow.title")}
          title={t("sports.workflow.fullSeason")}
        />
        <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {profile.workflow.map((step, index) => (
            <div
              key={step.title.en}
              className="relative rounded-2xl border border-border bg-surface p-6"
            >
              <span className="font-display flex size-9 items-center justify-center rounded-full bg-accent text-sm font-bold text-accent-foreground">
                {index + 1}
              </span>
              <p className="font-display mt-4 text-base font-semibold text-foreground">
                {pick(step.title, locale)}
              </p>
              <p className="mt-1.5 text-sm leading-relaxed text-muted">
                {pick(step.description, locale)}
              </p>
            </div>
          ))}
        </div>
      </Section>

      <Section bordered={false}>
        <figure className="mx-auto max-w-3xl rounded-3xl border border-border bg-surface p-8 text-center sm:p-10">
          <blockquote className="font-display text-2xl leading-snug font-semibold tracking-tight text-foreground">
            &ldquo;{pick(profile.testimonial.quote, locale)}&rdquo;
          </blockquote>
          <figcaption className="mt-6 flex items-center justify-center gap-3">
            <Avatar className="bg-accent/15 text-accent">
              <Avatar.Fallback>{profile.testimonial.initials}</Avatar.Fallback>
            </Avatar>
            <div className="text-start">
              <p className="text-sm font-semibold text-foreground">
                {pick(profile.testimonial.author, locale)}
              </p>
              <p className="text-sm text-muted">{pick(profile.testimonial.role, locale)}</p>
            </div>
          </figcaption>
        </figure>
      </Section>

      <Section muted>
        <SectionHeading title={t("sports.exploreOthers")} />
        <div className="mt-8 flex flex-wrap gap-3">
          {otherSports.map((item) => {
            const other = sportProfiles[item.slug];

            return (
              <RouterLink
                key={item.slug}
                className="link inline-flex items-center gap-2 rounded-full border border-border bg-surface px-4 py-2 text-sm font-medium transition-colors hover:border-accent"
                to={"/sports/" + item.slug}
              >
                <span
                  className="size-3 rounded-full"
                  style={other ? { background: other.accent } : undefined}
                />
                {pickL(item.name, locale)}
              </RouterLink>
            );
          })}
        </div>
      </Section>

      <CtaSection
        title={t("sports.runOn", { sport: sportName })}
        description={t("sports.runOnDesc")}
      />
    </div>
  );
}
