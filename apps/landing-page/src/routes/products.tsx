import { Button, Card } from "@heroui/react";
import { Link as RouterLink, Navigate, useParams } from "react-router";

import { findBySlug, pickL, pickLAll, products } from "../data/site";
import { useI18n } from "../i18n";
import { CtaSection, Section, SectionHeading } from "../components/marketing/sections";
import { PageHeader } from "../components/marketing/page-header";
import { Iconify } from "../icons/iconify";

export function ProductsRoute() {
  const { t, locale } = useI18n();

  return (
    <>
      <PageHeader
        eyebrow={t("products.eyebrow")}
        title={t("products.title")}
        description={t("products.subtitle")}
      />
      <Section bordered={false}>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {products.map((product) => (
            <Card
              key={product.slug}
              className="group h-full border border-border transition-all duration-300 hover:-translate-y-1 hover:border-accent"
              render={(props) => (
                <RouterLink to={"/products/" + product.slug} {...(props as object)} />
              )}
            >
              <div className="flex size-11 items-center justify-center rounded-xl bg-surface-secondary text-foreground transition-colors duration-300 group-hover:bg-accent group-hover:text-accent-foreground">
                <Iconify className="size-5" icon={product.icon} />
              </div>
              <Card.Header className="mt-4">
                <Card.Title className="font-display text-lg font-semibold">
                  {pickL(product.name, locale)}
                </Card.Title>
                <Card.Description className="mt-1.5 text-sm leading-relaxed text-muted">
                  {pickL(product.summary, locale)}
                </Card.Description>
              </Card.Header>
              <Card.Content className="mt-4 flex flex-row items-center gap-1 text-sm font-semibold text-accent-foreground">
                {t("common.learnMore")}
                <Iconify className="size-4 rtl:rotate-180" icon="arrow-right" />
              </Card.Content>
            </Card>
          ))}
        </div>
      </Section>
      <CtaSection
        title={t("products.details.wholePlatform")}
        description={t("products.details.wholePlatformDesc")}
      />
    </>
  );
}

export function ProductDetailRoute() {
  const { slug } = useParams();
  const { t, locale } = useI18n();
  const product = findBySlug(products, slug);

  if (!product) return <Navigate replace to="/products" />;

  const name = pickL(product.name, locale);

  return (
    <>
      <PageHeader
        crumbs={[
          { label: t("common.home"), href: "/" },
          { label: t("products.eyebrow"), href: "/products" },
          { label: name },
        ]}
        eyebrow={pickL(product.tagline, locale)}
        title={name}
        description={pickL(product.summary, locale)}
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
          eyebrow={t("sports.capabilities")}
          title={t("products.details.whatItDoes", { name })}
        />
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {product.features.map((feature) => (
            <Card key={feature.title.en} className="h-full border border-border">
              <div className="flex size-10 items-center justify-center rounded-xl bg-accent text-accent-foreground">
                <Iconify className="size-5" icon={feature.icon} />
              </div>
              <Card.Header className="mt-4">
                <Card.Title className="font-display text-base font-semibold">
                  {pickL(feature.title, locale)}
                </Card.Title>
                <Card.Description className="mt-1.5 text-sm leading-relaxed text-muted">
                  {pickL(feature.description, locale)}
                </Card.Description>
              </Card.Header>
            </Card>
          ))}
        </div>

        <div className="mt-12 rounded-2xl border border-border p-6 sm:p-8">
          <p className="text-xs font-medium tracking-wide text-muted uppercase">
            {t("products.details.highlights")}
          </p>
          <ul className="mt-4 grid gap-3 sm:grid-cols-3">
            {pickLAll(product.highlights, locale).map((point) => (
              <li key={point} className="flex items-center gap-2.5 text-sm">
                <Iconify
                  className="size-5 shrink-0 rounded-full bg-accent p-1 text-accent-foreground"
                  icon="check"
                />
                <span className="font-medium text-foreground">{point}</span>
              </li>
            ))}
          </ul>
        </div>
      </Section>

      <CtaSection
        title={t("products.details.readyToRun", { name: name.toLowerCase() })}
        description={t("products.details.readyToRunDesc")}
      />
    </>
  );
}
