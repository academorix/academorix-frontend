/**
 * @file blog/page.tsx
 * @module app/[locale]/blog/page
 *
 * @description
 * Blog index. Lists every post newest-first with category, date,
 * reading time, and a one-line description.
 */

import Link from "next/link";
import { setRequestLocale } from "next-intl/server";

import type { Metadata } from "next";
import type { ReactNode } from "react";

import { MarketingHero } from "@/components/marketing/marketing-hero";
import { MarketingShell } from "@/components/shell/marketing-shell";
import { LOCALE_BCP47_TAGS } from "@/i18n/routing";
import { getBlogPosts } from "@/lib/api";
import { resolveIcon } from "@/lib/icon-registry";

interface PageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;

  return {
    title: locale === "ar" ? "المدوّنة" : "Blog",
    alternates: { canonical: locale === "en" ? "/blog" : `/${locale}/blog` },
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

export default async function BlogIndexPage({ params }: PageProps): Promise<ReactNode> {
  const { locale } = await params;

  setRequestLocale(locale);

  const posts = await getBlogPosts(locale);

  return (
    <MarketingShell>
      <MarketingHero
        eyebrow={locale === "ar" ? "المدوّنة" : "Blog"}
        subtitle={
          locale === "ar"
            ? "المنتج، الهندسة، الامتثال، والتشغيل عبر الأكاديميات متعددة الفروع."
            : "Product, engineering, compliance, and operations across multi-branch academies."
        }
        title={locale === "ar" ? "أخبار وأفكار من الفريق" : "Notes and thinking from the team"}
      />

      <section className="mx-auto max-w-6xl px-6 pb-24">
        <ul className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {posts.map((post) => {
            const Icon = resolveIcon(post.hero_icon);

            return (
              <li key={post.slug}>
                <Link
                  className="group flex h-full flex-col gap-4 rounded-2xl border border-default/40 bg-surface/60 p-6 backdrop-blur-md transition-colors hover:border-default hover:bg-surface/80"
                  href={`/blog/${post.slug}`}
                >
                  <div className="flex items-center justify-between">
                    <span className="inline-flex size-10 items-center justify-center rounded-xl bg-default/60 text-foreground">
                      <Icon aria-hidden className="size-5" />
                    </span>
                    <span className="text-xs font-medium tracking-wider text-muted uppercase">
                      {post.category}
                    </span>
                  </div>
                  <h3 className="text-lg font-semibold text-foreground group-hover:text-accent">
                    {post.title}
                  </h3>
                  <p className="text-sm text-muted">{post.description}</p>
                  <p className="mt-auto pt-2 text-xs text-muted">
                    {formatDate(post.date, locale)} · {post.reading_minutes}{" "}
                    {locale === "ar" ? "دقيقة قراءة" : "min read"}
                  </p>
                </Link>
              </li>
            );
          })}
        </ul>
      </section>
    </MarketingShell>
  );
}
