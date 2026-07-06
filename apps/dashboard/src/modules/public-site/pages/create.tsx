/**
 * @file create.tsx
 * @module modules/public-site/pages/create
 *
 * @description
 * Public page create screen. `useForm` drives the mutation and redirects to the
 * list. Public pages are tenant-level, so no scope is injected.
 */

import { useForm } from "@refinedev/core";

import type { PublicPage } from "@/modules/public-site/public-site.types";
import type { ReactNode } from "react";

import { CreateView } from "@/components/refine";
import {
  PublicPageForm,
  toPublicPagePayload,
} from "@/modules/public-site/components/public-page-form";

/** The public page create page. */
export default function PublicSiteCreate(): ReactNode {
  const { onFinish, formLoading } = useForm<PublicPage>({
    resource: "public-site",
    action: "create",
    redirect: "list",
  });

  return (
    <CreateView resource="public-site">
      <PublicPageForm
        isSubmitting={formLoading}
        submitLabel="Create page"
        onSubmit={(values) => {
          void onFinish(toPublicPagePayload(values));
        }}
      />
    </CreateView>
  );
}
