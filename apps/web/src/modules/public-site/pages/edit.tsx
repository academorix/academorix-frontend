/**
 * @file edit.tsx
 * @module modules/public-site/pages/edit
 *
 * @description
 * Public page edit screen. Renders the shared form once the record has loaded.
 */

import { Spinner } from "@academorix/ui/react";
import { useForm } from "@refinedev/core";

import type { PublicPage } from "@/modules/public-site/public-site.types";
import type { ReactNode } from "react";

import { EditView } from "@/components/refine";
import {
  PublicPageForm,
  toPublicPagePayload,
} from "@/modules/public-site/components/public-page-form";

/** The public page edit page. */
export default function PublicSiteEdit(): ReactNode {
  const { query, onFinish, formLoading } = useForm<PublicPage>({
    resource: "public-site",
    action: "edit",
    redirect: "list",
  });

  const record = query?.data?.data;

  return (
    <EditView resource="public-site">
      {record ? (
        <PublicPageForm
          initialValues={record}
          isSubmitting={formLoading}
          submitLabel="Save changes"
          onSubmit={(values) => {
            void onFinish(toPublicPagePayload(values));
          }}
        />
      ) : (
        <div className="flex h-40 items-center justify-center">
          <Spinner aria-label="Loading" />
        </div>
      )}
    </EditView>
  );
}
