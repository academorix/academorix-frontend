/**
 * @file page.tsx
 * @module app/[locale]/legal/[slug]/page
 *
 * @description
 * Legal deep page. Renders a legal document (privacy / terms / security /
 * cookies / DPA) from `public/data/{locale}/legal.json`, falling back to
 * English if the localised copy hasn't shipped yet. Each document has:
 *
 *   - `title`, `description`, `effective_date`
 *   - `sections[]` with `title` + `paragraphs[]`
 *
 * Paragraphs support inline markdown-style bold via `**word**` — the
 * `renderParagraph()` helper below splits every paragraph into segments
 * and bolds every `**...**` chunk in place.
 */

import { getTranslations, setRequestLocale } from "next-intl/server";

import type { Metadata } from "next";
import type { Key, ReactNode } from "react";

import { MarketingShell } from "@/components/marketing/marketing-shell";
import { LOCALES } from "@/i18n/routing";
import { getLegal, getLegalOrNotFound, getLegalSlugs } from "@/lib/api";

/** Route props. */
interface LegalPageProps {
  params: Promise<{ locale: string; slug: string }>;
}

/** Pre-renders every legal slug for every locale at build time. */
export async function generateStaticParams(): Promise<Array<{ locale: string; slug: string }>> {
  const slugs = await getLegalSlugs();

  return LOCALES.flatMap((locale) => slugs.map((slug) => ({ locale, slug })));
}

/** Generates the tab title + OG card + canonical URL. */
export async function generateMetadata({ params }: LegalPageProps): Promise<Metadata> {
  const { locale, slug } = await params;
  const page = await getLegal(slug, locale);

  if (!page) {
    return { title: "Not found", robots: { index: false } };
  }

  const canonical = locale === "en" ? `/legal/${page.slug}` : `/${locale}/legal/${page.slug}`;

  return {
    title: page.title,
    description: page.description,
    alternates: { canonical },
    openGraph: {
      title: `Academorix — ${page.title}`,
      description: page.description,
      url: canonical,
    },
  };
}

/**
 * Renders a paragraph, bolding every `**segment**` fragment. Legal fixtures
 * embed strong emphasis inline — this keeps the JSON source-readable while
 * still producing typographically correct output.
 */
function renderParagraph(text: string): ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);

  return parts.map((part, index) => {
    const key: Key = `${index}-${part.length}`;

    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={key} className="font-semibold text-foreground">
          {part.slice(2, -2)}
        </strong>
      );
    }

    return <span key={key}>{part}</span>;
  });
}

/** The legal deep page. */
export default async function LegalPage({ params }: LegalPageProps): Promise<ReactNode> {
  const { locale, slug } = await params;

  setRequestLocale(locale);

  const [page, t] = await Promise.all([
    getLegalOrNotFound(slug, locale),
    getTranslations({ locale, namespace: "legal" }),
  ]);

  return (
    <MarketingShell>
      <article className="mx-auto w-full max-w-3xl px-6 pt-20 pb-20">
        <header className="mb-12 flex flex-col gap-4 border-b border-default pb-10">
          <span className="text-xs font-semibold tracking-wider text-muted uppercase">
            {t("eyebrow")}
          </span>
          <h1 className="text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
            {page.title}
          </h1>
          <p className="text-lg text-muted">{page.description}</p>
          <p className="text-xs text-muted">{t("effectiveDate", { date: page.effective_date })}</p>
        </header>

        <div className="flex flex-col gap-10 text-base leading-relaxed text-muted">
          {page.sections.map((section) => (
            <section key={section.title} aria-labelledby={`legal-${section.title}`}>
              <h2
                className="mb-3 text-xl font-semibold text-foreground"
                id={`legal-${section.title}`}
              >
                {section.title}
              </h2>
              <div className="flex flex-col gap-3">
                {section.paragraphs.map((paragraph, index) => (
                  <p key={`${section.title}-${index}`}>{renderParagraph(paragraph)}</p>
                ))}
              </div>
            </section>
          ))}
        </div>
      </article>
    </MarketingShell>
  );
}
