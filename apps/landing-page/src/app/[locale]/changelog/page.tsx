/**
 * @file page.tsx
 * @module app/[locale]/changelog/page
 *
 * @description
 * Product changelog handoff. We forward every request under `/changelog`
 * (bare English + locale-prefixed) to the Featurebase board configured via
 * `NEXT_PUBLIC_FEATUREBASE_URL` (default `academorix.featurebase.app`).
 *
 * Featurebase owns the roadmap board, changelog stream, and user upvote
 * flow, so the marketing app doesn't try to duplicate it. Users are
 * redirected server-side at the edge — no client roundtrip, no flash of
 * placeholder content.
 *
 * Because this is a permanent handoff, we use HTTP 308 (permanent + method
 * preserved) so search engines transfer any accumulated authority to the
 * external destination and browsers cache the redirect aggressively.
 */

import { permanentRedirect } from "next/navigation";

import type { Metadata } from "next";
import type { ReactNode } from "react";

import { envConfig } from "@/config/env.config";

/** Props for {@link ChangelogPage}. */
interface ChangelogPageProps {
  params: Promise<{ locale: string }>;
}

/**
 * Metadata — never actually rendered (the redirect fires before the body
 * ships) but kept so search-engine crawlers that probe the metadata endpoint
 * see the right title + canonical.
 */
export async function generateMetadata({ params }: ChangelogPageProps): Promise<Metadata> {
  const { locale } = await params;

  return {
    title: "Changelog · Academorix",
    description: "Product updates, release notes, and roadmap for Academorix.",
    alternates: { canonical: locale === "en" ? "/changelog" : `/${locale}/changelog` },
    robots: { index: false, follow: false },
  };
}

/**
 * The changelog "page" is a server-side redirect to Featurebase. Rendering
 * `permanentRedirect` inside a Server Component throws a `NEXT_REDIRECT`
 * signal Next.js intercepts to emit a 308 to the client.
 */
export default function ChangelogPage(): ReactNode {
  permanentRedirect(envConfig.changelogUrl);
}
