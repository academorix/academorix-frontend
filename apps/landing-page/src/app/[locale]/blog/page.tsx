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

import { BlogCover } from "@/components/marketing/blog-cover";
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
                  className="group flex h-full flex-col overflow-hidden rounded-2xl border border-default/40 bg-surface/60 backdrop-blur-md transition-[transform,border-color,background-color,box-shadow] duration-300 ease-out hover:-translate-y-1 hover:border-default hover:bg-surface/80 hover:shadow-lg"
                  href={`/blog/${post.slug}`}
                >
                  <div className="relative aspect-[5/3] overflow-hidden border-b border-default/30">
                    <BlogCover
                      category={post.category}
                      className="h-full w-full transition-transform duration-500 group-hover:scale-[1.03]"
                      slug={post.slug}
                    />
                    <span className="absolute end-3 top-3 inline-flex items-center rounded-full border border-default/60 bg-surface/85 px-2.5 py-0.5 text-[10px] font-medium tracking-wider text-muted uppercase backdrop-blur-sm">
                      {post.category}
                    </span>
                  </div>
                  <div className="flex flex-1 flex-col gap-3 p-6">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex size-8 items-center justify-center rounded-lg bg-default/60 text-foreground">
                        <Icon aria-hidden className="size-4" />
                      </span>
                      <span className="text-[11px] text-muted">
                        {formatDate(post.date, locale)}
                        {" · "}
                        {post.reading_minutes} {locale === "ar" ? "دقيقة قراءة" : "min read"}
                      </span>
                    </div>
                    <h3 className="text-lg font-semibold text-foreground group-hover:text-accent">
                      {post.title}
                    </h3>
                    <p className="text-sm text-muted">{post.description}</p>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      </section>
    </MarketingShell>
  );
}
