/**
 * @file page.tsx
 * @module app/[locale]/docs/page
 *
 * @description
 * Docs portal handoff. We forward every request under `/docs` to the
 * Mintlify-hosted documentation origin configured via `NEXT_PUBLIC_DOCS_URL`
 * (default `docs.academorix.com`).
 *
 * Mintlify owns the docs IA, versioning, search, and API reference render
 * pipeline, so the marketing app doesn't try to embed or duplicate it.
 * Users are redirected server-side at the edge — no client roundtrip, no
 * flash of placeholder content.
 *
 * A permanent 308 hands SEO authority to the docs origin, which is where
 * we want documentation queries to land.
 */

import { permanentRedirect } from "next/navigation";

import type { Metadata } from "next";
import type { ReactNode } from "react";

import { getDocsUrl } from "@/lib/env";

/** Props for {@link DocsPage}. */
interface DocsPageProps {
  params: Promise<{ locale: string }>;
}

/**
 * Metadata — see {@link ChangelogPage} rationale. Not rendered but kept for
 * crawler probes.
 */
export async function generateMetadata({ params }: DocsPageProps): Promise<Metadata> {
  const { locale } = await params;

  return {
    title: "Docs · Academorix",
    description: "Guides, API reference, and best practices for building on Academorix.",
    alternates: { canonical: locale === "en" ? "/docs" : `/${locale}/docs` },
    robots: { index: false, follow: false },
  };
}

/** Server-side 308 redirect to the Mintlify docs origin. */
export default function DocsPage(): ReactNode {
  permanentRedirect(getDocsUrl());
}
