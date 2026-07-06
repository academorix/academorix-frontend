/**
 * @file page.tsx
 * @module app/[locale]/products/page
 *
 * @description
 * Product index — grid of every product deep page. Server Component;
 * awaits `getProducts()` for the active locale and renders a responsive
 * tile list linking to `/products/[slug]` (or `/{locale}/products/[slug]`
 * for non-default locales).
 */

import { ArrowRightIcon } from "@academorix/ui/icons/outline";
import { getTranslations, setRequestLocale } from "next-intl/server";

import type { Metadata } from "next";
import type { ReactNode } from "react";

import { MarketingShell } from "@/components/marketing/marketing-shell";
import { Link } from "@/i18n/navigation";
import { getProducts } from "@/lib/api";
import { resolveIcon } from "@/lib/icon-registry";

/** Props for {@link ProductsIndexPage}. */
interface ProductsIndexPageProps {
  params: Promise<{ locale: string }>;
}

/** Per-page metadata. */
export async function generateMetadata({ params }: ProductsIndexPageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "products.meta" });

  return {
    title: t("title"),
    description: t("description"),
    alternates: { canonical: locale === "en" ? "/products" : `/${locale}/products` },
  };
}

/** The products index page. */
export default async function ProductsIndexPage({
  params,
}: ProductsIndexPageProps): Promise<ReactNode> {
  const { locale } = await params;

  setRequestLocale(locale);

  const [products, t, tCommon] = await Promise.all([
    getProducts(locale),
    getTranslations({ locale, namespace: "products" }),
    getTranslations({ locale, namespace: "common" }),
  ]);

  return (
    <MarketingShell>
      <section
        aria-labelledby="products-index-heading"
        className="mx-auto w-full max-w-6xl px-6 pt-20 pb-16"
      >
        <div className="mb-14 flex flex-col items-start gap-4">
          <span className="text-xs font-semibold tracking-wider text-muted uppercase">
            {t("eyebrow")}
          </span>
          <h1
            className="text-4xl font-semibold tracking-tight text-foreground sm:text-5xl"
            id="products-index-heading"
          >
            {t("indexTitle")}
          </h1>
          <p className="max-w-2xl text-lg text-muted">{t("indexDescription")}</p>
        </div>

        <ul className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {products.map((product) => {
            const Icon = resolveIcon(product.hero_icon);

            return (
              <li key={product.slug}>
                <Link
                  className="group flex h-full flex-col gap-4 rounded-xl border border-default bg-surface p-6 transition-colors hover:border-foreground/20"
                  href={`/products/${product.slug}`}
                >
                  <span className="flex size-11 items-center justify-center rounded-xl bg-accent/10 text-accent">
                    <Icon aria-hidden="true" className="size-6" />
                  </span>
                  <div className="flex flex-1 flex-col gap-2">
                    <h2 className="text-lg font-semibold text-foreground">{product.title}</h2>
                    <p className="text-sm leading-relaxed text-muted">{product.description}</p>
                  </div>
                  <span className="inline-flex items-center gap-1 text-sm font-medium text-accent transition-transform group-hover:translate-x-0.5">
                    {tCommon("learnMore")}
                    <ArrowRightIcon aria-hidden="true" className="size-3.5" />
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </section>
    </MarketingShell>
  );
}
