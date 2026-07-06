/**
 * @file page.tsx
 * @module app/[locale]/find-workspaces/page
 *
 * @description
 * "Find my workspaces" recovery form. Anonymous visitors enter their email
 * and the backend emails them the list of workspaces they belong to.
 * Always resolves 200 client-side (anti-enumeration).
 *
 * Server Component: pre-loads `site` metadata for the active locale and
 * passes it to the interactive `<FindWorkspacesForm />` Client Component.
 */

import { getTranslations, setRequestLocale } from "next-intl/server";

import type { Metadata } from "next";
import type { ReactNode } from "react";

import { FindWorkspacesForm } from "@/components/onboarding/find-workspaces-form";
import { getSite } from "@/lib/api";

/** Props for {@link FindWorkspacesPage}. */
interface FindWorkspacesPageProps {
  params: Promise<{ locale: string }>;
}

/** Per-page metadata. */
export async function generateMetadata({ params }: FindWorkspacesPageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "findWorkspaces.meta" });

  return {
    title: t("title"),
    description: t("description"),
    alternates: {
      canonical: locale === "en" ? "/find-workspaces" : `/${locale}/find-workspaces`,
    },
    robots: { index: false },
  };
}

/** The find-workspaces page shell. */
export default async function FindWorkspacesPage({
  params,
}: FindWorkspacesPageProps): Promise<ReactNode> {
  const { locale } = await params;

  setRequestLocale(locale);

  const site = await getSite(locale);

  return <FindWorkspacesForm site={site} />;
}
