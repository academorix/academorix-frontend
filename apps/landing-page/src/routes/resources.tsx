import { Button, Card, Chip, Form, Input, Label, TextField } from "@heroui/react";
import { Link as RouterLink, Navigate, useParams } from "react-router";

import { changelog, docArticles, findBySlug, pickL, pickLAll, tutorials } from "../data/site";
import { useI18n } from "../i18n";
import { Section, SectionHeading } from "../components/marketing/sections";
import { PageHeader } from "../components/marketing/page-header";
import { Iconify } from "../icons/iconify";

export function DocsRoute() {
  const { t, locale } = useI18n();

  // Group by the stable English category name; render the localized label from the first article in each bucket.
  const groups = new Map<string, { label: string; items: typeof docArticles }>();
  for (const article of docArticles) {
    const key = article.category.en;
    const bucket = groups.get(key);
    if (bucket) {
      bucket.items.push(article);
    } else {
      groups.set(key, { label: pickL(article.category, locale), items: [article] });
    }
  }

  return (
    <>
      <PageHeader
        eyebrow={t("resources.docs.eyebrow")}
        title={t("resources.docs.indexTitle")}
        description={t("resources.docs.indexSubtitle")}
      />
      <Section bordered={false}>
        <div className="space-y-12">
          {Array.from(groups.entries()).map(([key, group]) => (
            <div key={key}>
              <h2 className="font-display text-lg font-semibold text-foreground">{group.label}</h2>
              <div className="mt-4 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {group.items.map((article) => (
                  <Card
                    key={article.slug}
                    className="group h-full border border-border transition-all duration-300 hover:-translate-y-1 hover:border-accent"
                    render={(props) => (
                      <RouterLink to={"/docs/" + article.slug} {...(props as object)} />
                    )}
                  >
                    <Card.Header>
                      <Card.Title className="font-display text-base font-semibold">
                        {pickL(article.title, locale)}
                      </Card.Title>
                      <Card.Description className="mt-1.5 text-sm leading-relaxed text-muted">
                        {pickL(article.summary, locale)}
                      </Card.Description>
                    </Card.Header>
                    <Card.Content className="mt-3 flex flex-row items-center gap-1 text-sm font-semibold text-accent-foreground">
                      {t("resources.docs.read")}
                      <Iconify className="size-4 rtl:rotate-180" icon="arrow-right" />
                    </Card.Content>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Section>
    </>
  );
}

export function DocDetailRoute() {
  const { slug } = useParams();
  const { t, locale } = useI18n();
  const article = findBySlug(docArticles, slug);

  if (!article) return <Navigate replace to="/docs" />;

  const category = pickL(article.category, locale);
  const title = pickL(article.title, locale);

  return (
    <>
      <PageHeader
        crumbs={[
          { label: t("resources.docs.eyebrow"), href: "/docs" },
          { label: category },
          { label: title },
        ]}
        eyebrow={category}
        title={title}
        description={pickL(article.summary, locale)}
      />
      <Section bordered={false}>
        <article className="mx-auto max-w-3xl space-y-5">
          {article.body.map((paragraph) => (
            <p key={paragraph.en} className="text-lg leading-relaxed text-foreground">
              {pickL(paragraph, locale)}
            </p>
          ))}
          <div className="pt-4">
            <Button
              render={(props) => <RouterLink to="/docs" {...(props as object)} />}
              variant="outline"
            >
              <Iconify className="size-4 rtl:rotate-180" icon="arrow-right" />
              {t("resources.docs.backToDocs")}
            </Button>
          </div>
        </article>
      </Section>
    </>
  );
}

const changelogTone: Record<string, "accent" | "success" | "warning"> = {
  New: "accent",
  Improved: "success",
  Fixed: "warning",
};

const changelogTagKey: Record<string, string> = {
  New: "resources.changelog.tag.new",
  Improved: "resources.changelog.tag.improved",
  Fixed: "resources.changelog.tag.fixed",
};

export function ChangelogRoute() {
  const { t, locale } = useI18n();

  return (
    <>
      <PageHeader
        eyebrow={t("resources.changelog.eyebrow")}
        title={t("resources.changelog.whatsNew")}
        description={t("resources.changelog.whatsNewDesc")}
      />
      <Section bordered={false}>
        <div className="mx-auto max-w-3xl space-y-6">
          {changelog.map((entry) => (
            <Card key={entry.version} className="border border-border">
              <div className="flex flex-wrap items-center gap-3">
                <Chip color={changelogTone[entry.tag]} size="sm" variant="soft">
                  {t(changelogTagKey[entry.tag])}
                </Chip>
                <span className="text-xs text-muted">
                  v{entry.version} · {entry.date}
                </span>
              </div>
              <Card.Header className="mt-3">
                <Card.Title className="font-display text-lg font-semibold">
                  {pickL(entry.title, locale)}
                </Card.Title>
              </Card.Header>
              <Card.Content className="mt-3">
                <ul className="space-y-2">
                  {pickLAll(entry.items, locale).map((item) => (
                    <li key={item} className="flex items-start gap-2.5 text-sm">
                      <Iconify
                        className="mt-0.5 size-4 shrink-0 rounded-full bg-accent p-0.5 text-accent-foreground"
                        icon="check"
                      />
                      <span className="text-foreground">{item}</span>
                    </li>
                  ))}
                </ul>
              </Card.Content>
            </Card>
          ))}
        </div>
      </Section>
    </>
  );
}

export function NewsletterRoute() {
  const { t } = useI18n();

  return (
    <>
      <PageHeader
        align="center"
        eyebrow={t("resources.newsletter.eyebrow")}
        title={t("resources.newsletter.title")}
        description={t("resources.newsletter.subtitle")}
      />
      <Section bordered={false}>
        <Card className="mx-auto max-w-xl border border-border">
          <Card.Header>
            <Card.Title className="font-display text-lg font-semibold">
              {t("resources.newsletter.cardTitle")}
            </Card.Title>
            <Card.Description className="mt-1 text-sm text-muted">
              {t("resources.newsletter.cardDesc")}
            </Card.Description>
          </Card.Header>
          <Card.Content className="mt-4">
            <Form className="flex flex-col gap-4 sm:flex-row sm:items-end">
              <TextField
                className="flex-1"
                isRequired
                name="email"
                type="email"
                variant="secondary"
              >
                <Label>{t("common.email")}</Label>
                <Input placeholder={t("common.emailPlaceholder")} />
              </TextField>
              <Button type="submit" variant="primary">
                {t("common.subscribe")}
                <Iconify className="size-4" icon="paper-plane" />
              </Button>
            </Form>
          </Card.Content>
        </Card>
      </Section>
    </>
  );
}

export function TutorialsRoute() {
  const { t, locale } = useI18n();

  return (
    <>
      <PageHeader
        crumbs={[
          { label: t("resources.tutorials.resourcesCrumb"), href: "/docs" },
          { label: t("resources.tutorials.eyebrow") },
        ]}
        eyebrow={t("resources.tutorials.eyebrow")}
        title={t("resources.tutorials.indexTitle")}
        description={t("resources.tutorials.indexSubtitle")}
      />
      <Section bordered={false}>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {tutorials.map((tutorial) => (
            <Card
              key={tutorial.slug}
              className="group flex h-full flex-col border border-border transition-all duration-300 hover:-translate-y-1 hover:border-accent"
              render={(props) => (
                <RouterLink to={"/resources/tutorials/" + tutorial.slug} {...(props as object)} />
              )}
            >
              <div className="flex items-center gap-2">
                <Chip size="sm" variant="secondary">
                  {pickL(tutorial.level, locale)}
                </Chip>
                <span className="text-xs text-muted">{pickL(tutorial.duration, locale)}</span>
              </div>
              <Card.Header className="mt-3">
                <Card.Title className="font-display text-base font-semibold">
                  {pickL(tutorial.title, locale)}
                </Card.Title>
                <Card.Description className="mt-1.5 text-sm leading-relaxed text-muted">
                  {pickL(tutorial.summary, locale)}
                </Card.Description>
              </Card.Header>
            </Card>
          ))}
        </div>
      </Section>
    </>
  );
}

export function TutorialDetailRoute() {
  const { slug } = useParams();
  const { t, locale } = useI18n();
  const tutorial = findBySlug(tutorials, slug);

  if (!tutorial) return <Navigate replace to="/resources/tutorials" />;

  const title = pickL(tutorial.title, locale);
  const level = pickL(tutorial.level, locale);
  const duration = pickL(tutorial.duration, locale);

  return (
    <>
      <PageHeader
        crumbs={[
          { label: t("resources.tutorials.resourcesCrumb"), href: "/docs" },
          { label: t("resources.tutorials.eyebrow"), href: "/resources/tutorials" },
          { label: title },
        ]}
        eyebrow={level + " · " + duration}
        title={title}
        description={pickL(tutorial.summary, locale)}
      />
      <Section bordered={false}>
        <div className="mx-auto max-w-3xl">
          <SectionHeading title={t("resources.tutorials.stepsHeading")} />
          <ol className="mt-8 space-y-4">
            {pickLAll(tutorial.steps, locale).map((step, index) => (
              <li
                key={step}
                className="flex items-start gap-4 rounded-2xl border border-border p-5"
              >
                <span className="font-display flex size-8 shrink-0 items-center justify-center rounded-full bg-accent text-sm font-bold text-accent-foreground">
                  {index + 1}
                </span>
                <span className="pt-1 text-base font-medium text-foreground">{step}</span>
              </li>
            ))}
          </ol>
          <div className="pt-8">
            <Button
              render={(props) => <RouterLink to="/resources/tutorials" {...(props as object)} />}
              variant="outline"
            >
              <Iconify className="size-4 rtl:rotate-180" icon="arrow-right" />
              {t("resources.tutorials.backToAll")}
            </Button>
          </div>
        </div>
      </Section>
    </>
  );
}
