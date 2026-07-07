/**
 * @file blog/[slug]/page.tsx
 * @module app/[locale]/blog/[slug]/page
 *
 * @description
 * Blog post template. Renders a single post from `blog.json` with
 * category eyebrow, title, author byline, date, reading time, body
 * paragraphs, and related links. Feeds `generateStaticParams` from
 * the catalog.
 */

import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";

import type { Metadata } from "next";
import type { ReactNode } from "react";

import { CtaBand } from "@/components/marketing/cta-band";
import { RelatedLinks } from "@/components/marketing/related-links";
import { MarketingShell } from "@/components/shell/marketing-shell";
import { LOCALE_BCP47_TAGS } from "@/i18n/routing";
import { getAuthor, getBlogPost, getBlogSlugs } from "@/lib/api";
import { resolveIcon } from "@/lib/icon-registry";

interface PageProps {
  params: Promise<{ locale: string; slug: string }>;
}

export async function generateStaticParams(): Promise<Array<{ locale: string; slug: string }>> {
  const slugs = await getBlogSlugs();

  return slugs.flatMap((slug) => [
    { locale: "en", slug },
    { locale: "ar", slug },
  ]);
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale, slug } = await params;
  const post = await getBlogPost(slug, locale);

  if (!post) return {};

  return {
    title: post.title,
    description: post.description,
    alternates: {
      canonical: locale === "en" ? `/blog/${slug}` : `/${locale}/blog/${slug}`,
    },
  };
}

function formatDate(iso: string, locale: string): string {
  const tag = LOCALE_BCP47_TAGS[locale as keyof typeof LOCALE_BCP47_TAGS] ?? locale;

  return new Intl.DateTimeFormat(tag, {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(iso));
}

export default async function BlogPostPage({ params }: PageProps): Promise<ReactNode> {
  const { locale, slug } = await params;

  setRequestLocale(locale);

  const post = await getBlogPost(slug, locale);

  if (!post) notFound();

  const author = await getAuthor(post.author, locale);
  const Icon = resolveIcon(post.hero_icon);

  return (
    <MarketingShell>
      <article className="mx-auto max-w-3xl px-6 py-24">
        <header className="mb-10 flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <span className="inline-flex size-10 items-center justify-center rounded-xl bg-default/60 text-foreground">
              <Icon aria-hidden className="size-5" />
            </span>
            <span className="text-xs font-medium tracking-wider text-muted uppercase">
              {post.category}
            </span>
          </div>
          <h1 className="text-4xl font-semibold tracking-tight text-balance text-foreground sm:text-5xl">
            {post.title}
          </h1>
          <p className="text-base text-muted">{post.description}</p>
          <div className="flex items-center gap-3 pt-2 text-xs text-muted">
            {author ? (
              <>
                <span className="grid size-8 place-content-center rounded-full bg-accent/20 text-[10px] font-semibold tracking-wider text-accent uppercase">
                  {author.initials}
                </span>
                <span>
                  <span className="font-medium text-foreground">{author.name}</span>
                  {" · "}
                  {author.role}
                </span>
                <span aria-hidden>·</span>
              </>
            ) : null}
            <span>{formatDate(post.date, locale)}</span>
            <span aria-hidden>·</span>
            <span>
              {post.reading_minutes} {locale === "ar" ? "دقيقة قراءة" : "min read"}
            </span>
          </div>
        </header>

        <div className="space-y-6 text-base leading-relaxed text-foreground">
          {post.body.map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </div>
      </article>

      <RelatedLinks heading={locale === "ar" ? "اقرأ أيضاً" : "Read next"} items={post.related} />

      <CtaBand
        ctaPrimary={{
          label: locale === "ar" ? "ابدأ الآن" : "Get started",
          type: "signup",
        }}
        description={
          locale === "ar"
            ? "أنشئ مساحة عملك في دقائق. لا حاجة إلى بطاقة ائتمان."
            : "Create your workspace in minutes. No credit card required."
        }
        title={locale === "ar" ? "جرب Academorix اليوم" : "Try Academorix today"}
      />
    </MarketingShell>
  );
}
