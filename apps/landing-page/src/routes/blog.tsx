import { Button, Card, Chip } from "@heroui/react";
import { Link as RouterLink, Navigate, useParams } from "react-router";

import { blogPosts, findBySlug, pickL } from "../data/site";
import { useI18n } from "../i18n";
import { CtaSection, Section } from "../components/marketing/sections";
import { PageHeader } from "../components/marketing/page-header";
import { Iconify } from "../icons/iconify";

export function BlogRoute() {
  const { t, locale } = useI18n();
  const [featured, ...rest] = blogPosts;

  return (
    <>
      <PageHeader
        eyebrow={t("blog.eyebrow")}
        title={t("blog.title")}
        description={t("blog.subtitle")}
      />
      <Section bordered={false}>
        <Card
          className="group border border-border transition-all duration-300 hover:border-accent"
          render={(props) => <RouterLink to={"/blog/" + featured.slug} {...(props as object)} />}
        >
          <div className="flex flex-wrap items-center gap-3">
            <Chip color="accent" size="sm" variant="soft">
              {t("blog.featured")}
            </Chip>
            <span className="text-xs text-muted">
              {t("blog.featuredMeta", {
                category: pickL(featured.category, locale),
                date: featured.date,
                readTime: pickL(featured.readTime, locale),
              })}
            </span>
          </div>
          <Card.Header className="mt-3">
            <Card.Title className="font-display text-2xl font-bold tracking-tight sm:text-3xl">
              {pickL(featured.title, locale)}
            </Card.Title>
            <Card.Description className="mt-2 text-base leading-relaxed text-muted">
              {pickL(featured.excerpt, locale)}
            </Card.Description>
          </Card.Header>
          <Card.Content className="mt-4 flex flex-row items-center gap-1 text-sm font-semibold text-accent-foreground">
            {t("blog.readArticle")}
            <Iconify className="size-4 rtl:rotate-180" icon="arrow-right" />
          </Card.Content>
        </Card>

        <div className="mt-8 grid gap-6 md:grid-cols-3">
          {rest.map((post) => (
            <Card
              key={post.slug}
              className="group flex h-full flex-col border border-border transition-all duration-300 hover:-translate-y-1 hover:border-accent"
              render={(props) => <RouterLink to={"/blog/" + post.slug} {...(props as object)} />}
            >
              <Chip size="sm" variant="secondary">
                {pickL(post.category, locale)}
              </Chip>
              <Card.Header className="mt-3">
                <Card.Title className="font-display text-lg font-semibold">
                  {pickL(post.title, locale)}
                </Card.Title>
                <Card.Description className="mt-1.5 text-sm leading-relaxed text-muted">
                  {pickL(post.excerpt, locale)}
                </Card.Description>
              </Card.Header>
              <Card.Content className="mt-4 text-xs text-muted">
                {t("blog.meta", { date: post.date, readTime: pickL(post.readTime, locale) })}
              </Card.Content>
            </Card>
          ))}
        </div>
      </Section>

      <CtaSection title={t("blog.indexCtaTitle")} description={t("blog.indexCtaDesc")} />
    </>
  );
}

export function BlogPostRoute() {
  const { slug } = useParams();
  const { t, locale } = useI18n();
  const post = findBySlug(blogPosts, slug);

  if (!post) return <Navigate replace to="/blog" />;

  const category = pickL(post.category, locale);
  const title = pickL(post.title, locale);

  return (
    <>
      <PageHeader
        crumbs={[
          { label: t("common.home"), href: "/" },
          { label: t("blog.eyebrow"), href: "/blog" },
          { label: category },
        ]}
        eyebrow={category}
        title={title}
        description={pickL(post.excerpt, locale)}
      >
        <p className="text-sm text-muted">
          {t("blog.byLine", {
            author: pickL(post.author, locale),
            date: post.date,
            readTime: pickL(post.readTime, locale),
          })}
        </p>
      </PageHeader>

      <Section bordered={false}>
        <article className="mx-auto max-w-3xl space-y-5">
          {post.body.map((paragraph) => (
            <p key={paragraph.en} className="text-lg leading-relaxed text-foreground">
              {pickL(paragraph, locale)}
            </p>
          ))}
          <div className="pt-4">
            <Button
              render={(props) => <RouterLink to="/blog" {...(props as object)} />}
              variant="outline"
            >
              <Iconify className="size-4 rtl:rotate-180" icon="arrow-right" />
              {t("blog.backToBlog")}
            </Button>
          </div>
        </article>
      </Section>

      <CtaSection title={t("blog.detailCtaTitle")} description={t("blog.detailCtaDesc")} />
    </>
  );
}
