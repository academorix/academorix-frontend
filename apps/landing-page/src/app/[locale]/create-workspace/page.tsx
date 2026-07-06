/**
 * @file page.tsx
 * @module app/[locale]/create-workspace/page
 *
 * @description
 * Self-serve tenant creation, localised. Anonymous visitors on the marketing
 * surface fill in a workspace name, slug, business type, and owner
 * credentials — on success the browser is sent to
 * `https://{slug}.academorix.app/login`.
 *
 * ## Server / client split
 *
 * Server Component: awaits `getSite()`, `getBusinessTypes()`, and
 * `getPasswordRules()` for the current locale and hydrates the client-side
 * form (`<CreateWorkspaceForm />`). The form POSTs to
 * `/api/v1/tenants/register` via `lib/api-client/http.ts`.
 */

import { getTranslations, setRequestLocale } from "next-intl/server";

import type { Metadata } from "next";
import type { ReactNode } from "react";

import { CreateWorkspaceForm } from "@/components/onboarding/create-workspace-form";
import { getBusinessTypes, getPasswordRules, getSite } from "@/lib/api";

/** Props for {@link CreateWorkspacePage}. */
interface CreateWorkspacePageProps {
  params: Promise<{ locale: string }>;
}

/** Per-page metadata. */
export async function generateMetadata({ params }: CreateWorkspacePageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "createWorkspace.meta" });

  return {
    title: t("title"),
    description: t("description"),
    alternates: {
      canonical: locale === "en" ? "/create-workspace" : `/${locale}/create-workspace`,
    },
    robots: { index: false },
  };
}

/** The create-workspace page shell. */
export default async function CreateWorkspacePage({
  params,
}: CreateWorkspacePageProps): Promise<ReactNode> {
  const { locale } = await params;

  setRequestLocale(locale);

  const [site, businessTypes, policy] = await Promise.all([
    getSite(locale),
    getBusinessTypes(locale),
    getPasswordRules(locale),
  ]);

  return (
    <CreateWorkspaceForm businessTypes={businessTypes} passwordRules={policy.rules} site={site} />
  );
}
