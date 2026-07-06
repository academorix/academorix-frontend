/**
 * @file page.tsx
 * @module app/[locale]/resources/tutorials/page
 *
 * @description
 * Tutorials handoff — forwards every request under `/resources/tutorials`
 * to the Academorix YouTube channel configured via
 * `NEXT_PUBLIC_TUTORIALS_URL` (default `youtube.com/@academorix`).
 *
 * Video tutorials are hosted on YouTube so we get free CDN, embeddable
 * players, and channel subscriptions without maintaining our own video
 * pipeline. The mega-menu and footer link here; visitors land on the
 * channel homepage where the pinned playlist is the getting-started track.
 */

import { permanentRedirect } from "next/navigation";

import type { Metadata } from "next";
import type { ReactNode } from "react";

import { getTutorialsUrl } from "@/lib/env";

/** Props for {@link TutorialsPage}. */
interface TutorialsPageProps {
  params: Promise<{ locale: string }>;
}

/**
 * Metadata — never rendered (redirect fires first) but kept for crawlers.
 */
export async function generateMetadata({ params }: TutorialsPageProps): Promise<Metadata> {
  const { locale } = await params;

  return {
    title: "Video tutorials · Academorix",
    description:
      "Step-by-step video tutorials for admins, coaches, and front desk staff — hosted on YouTube.",
    alternates: {
      canonical: locale === "en" ? "/resources/tutorials" : `/${locale}/resources/tutorials`,
    },
    robots: { index: false, follow: false },
  };
}

/** Server-side 308 redirect to the YouTube channel. */
export default function TutorialsPage(): ReactNode {
  permanentRedirect(getTutorialsUrl());
}
