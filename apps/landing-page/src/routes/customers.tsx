import { Avatar, Button, Card, Chip } from "@heroui/react";
import { Link as RouterLink, Navigate, useParams } from "react-router";

import { customers, findBySlug, pickL } from "../data/site";
import { useI18n } from "../i18n";
import { CtaSection, Section } from "../components/marketing/sections";
import { PageHeader } from "../components/marketing/page-header";
import { Iconify } from "../icons/iconify";

export function CustomersRoute() {
  const { t, locale } = useI18n();

  return (
    <>
      <PageHeader
        eyebrow={t("customers.eyebrow")}
        title={t("customers.indexTitle")}
        description={t("customers.indexSubtitle")}
      />
      <Section bordered={false}>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {customers.map((customer) => (
            <Card
              key={customer.slug}
              className="group flex h-full flex-col border border-border transition-all duration-300 hover:-translate-y-1 hover:border-accent"
              render={(props) => (
                <RouterLink to={"/customers/" + customer.slug} {...(props as object)} />
              )}
            >
              <div className="flex items-center gap-3">
                <span className="flex size-10 items-center justify-center rounded-lg border border-border text-sm font-bold">
                  {customer.initials}
                </span>
                <div>
                  <Card.Title className="font-display text-base font-semibold">
                    {pickL(customer.name, locale)}
                  </Card.Title>
                  <p className="text-xs text-muted">
                    {pickL(customer.sport, locale)} · {pickL(customer.location, locale)}
                  </p>
                </div>
              </div>
              <Card.Content className="mt-4 flex-1 text-sm leading-relaxed text-foreground">
                &ldquo;{pickL(customer.quote, locale)}&rdquo;
              </Card.Content>
              <div className="mt-4 flex items-center gap-1 text-sm font-semibold text-accent-foreground">
                {t("customers.readStory")}
                <Iconify className="size-4 rtl:rotate-180" icon="arrow-right" />
              </div>
            </Card>
          ))}
        </div>
      </Section>
      <CtaSection title={t("customers.indexCtaTitle")} description={t("customers.indexCtaDesc")} />
    </>
  );
}

export function CustomerDetailRoute() {
  const { slug } = useParams();
  const { t, locale } = useI18n();
  const customer = findBySlug(customers, slug);

  if (!customer) return <Navigate replace to="/customers" />;

  const name = pickL(customer.name, locale);
  const sport = pickL(customer.sport, locale);
  const location = pickL(customer.location, locale);

  return (
    <>
      <PageHeader
        crumbs={[
          { label: t("common.home"), href: "/" },
          { label: t("customers.eyebrow"), href: "/customers" },
          { label: name },
        ]}
        eyebrow={sport + " · " + location}
        title={name}
        description={pickL(customer.quote, locale)}
      />

      <Section bordered={false}>
        <div className="grid gap-6 sm:grid-cols-3">
          {customer.metrics.map((metric) => (
            <Card key={metric.label.en} className="border border-border text-center">
              <p className="font-display text-3xl font-extrabold tracking-tight text-foreground">
                {metric.value}
              </p>
              <p className="mt-1 text-sm text-muted">{pickL(metric.label, locale)}</p>
            </Card>
          ))}
        </div>

        <div className="mx-auto mt-12 max-w-3xl">
          <Chip color="accent" size="sm" variant="soft">
            {t("customers.storyTag")}
          </Chip>
          <div className="mt-4 space-y-4">
            {customer.story.map((paragraph) => (
              <p key={paragraph.en} className="text-lg leading-relaxed text-foreground">
                {pickL(paragraph, locale)}
              </p>
            ))}
          </div>

          <figure className="mt-10 rounded-2xl border border-border bg-surface-secondary p-6 sm:p-8">
            <blockquote className="font-display text-xl leading-snug font-semibold tracking-tight text-foreground">
              &ldquo;{pickL(customer.quote, locale)}&rdquo;
            </blockquote>
            <figcaption className="mt-5 flex items-center gap-3">
              <Avatar color="accent" variant="soft">
                <Avatar.Fallback>{customer.initials}</Avatar.Fallback>
              </Avatar>
              <div>
                <p className="text-sm font-semibold text-foreground">
                  {pickL(customer.author, locale)}
                </p>
                <p className="text-sm text-muted">{pickL(customer.role, locale)}</p>
              </div>
            </figcaption>
          </figure>

          <div className="mt-8">
            <Button
              render={(props) => <RouterLink to="/customers" {...(props as object)} />}
              variant="outline"
            >
              <Iconify className="size-4 rtl:rotate-180" icon="arrow-right" />
              {t("customers.allStories")}
            </Button>
          </div>
        </div>
      </Section>

      <CtaSection
        title={t("customers.detailCtaTitle")}
        description={t("customers.detailCtaDesc")}
      />
    </>
  );
}
