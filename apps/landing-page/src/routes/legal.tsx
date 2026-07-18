import { Card } from "@heroui/react";
import { Link as RouterLink, Navigate, useParams } from "react-router";

import { findBySlug, legalDocs, pickL } from "../data/site";
import { useI18n } from "../i18n";
import { Section } from "../components/marketing/sections";
import { PageHeader } from "../components/marketing/page-header";
import { Iconify } from "../icons/iconify";

export function LegalRoute() {
  const { t, locale } = useI18n();

  return (
    <>
      <PageHeader
        eyebrow={t("legal.eyebrow")}
        title={t("legal.indexTitle")}
        description={t("legal.indexSubtitle")}
      />
      <Section bordered={false}>
        <div className="grid gap-6 md:grid-cols-2">
          {legalDocs.map((doc) => (
            <Card
              key={doc.slug}
              className="group h-full border border-border transition-all duration-300 hover:-translate-y-1 hover:border-accent"
              render={(props) => <RouterLink to={"/legal/" + doc.slug} {...(props as object)} />}
            >
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-xl bg-surface-secondary text-foreground transition-colors duration-300 group-hover:bg-accent group-hover:text-accent-foreground">
                  <Iconify className="size-5" icon="file-text" />
                </div>
                <div>
                  <Card.Title className="font-display text-base font-semibold">
                    {pickL(doc.title, locale)}
                  </Card.Title>
                  <p className="text-xs text-muted">
                    {t("legal.updatedShort", { date: doc.updated })}
                  </p>
                </div>
              </div>
              <Card.Content className="mt-3 text-sm leading-relaxed text-muted">
                {pickL(doc.summary, locale)}
              </Card.Content>
            </Card>
          ))}
        </div>
      </Section>
    </>
  );
}

export function LegalDetailRoute() {
  const { slug } = useParams();
  const { t, locale } = useI18n();
  const doc = findBySlug(legalDocs, slug);

  if (!doc) return <Navigate replace to="/legal" />;

  const title = pickL(doc.title, locale);

  return (
    <>
      <PageHeader
        crumbs={[
          { label: t("common.home"), href: "/" },
          { label: t("legal.eyebrow"), href: "/legal" },
          { label: title },
        ]}
        title={title}
        description={pickL(doc.summary, locale)}
      >
        <p className="text-sm text-muted">{t("legal.updated", { date: doc.updated })}</p>
      </PageHeader>
      <Section bordered={false}>
        <div className="mx-auto max-w-3xl space-y-8">
          {doc.body.map((block) => (
            <div key={block.heading.en}>
              <h2 className="font-display text-xl font-semibold text-foreground">
                {pickL(block.heading, locale)}
              </h2>
              <p className="mt-2 text-base leading-relaxed text-muted">
                {pickL(block.text, locale)}
              </p>
            </div>
          ))}
        </div>
      </Section>
    </>
  );
}
