/**
 * @file edit.tsx
 * @module modules/integrations/pages/edit
 *
 * @description
 * Integration edit screen. Renders the shared form once the record has loaded.
 */

import { Spinner } from "@academorix/ui/react";
import { useForm } from "@refinedev/core";

import type { Integration } from "@/modules/integrations/integrations.types";
import type { ReactNode } from "react";

import { EditView } from "@/components/refine";
import {
  IntegrationForm,
  toIntegrationPayload,
} from "@/modules/integrations/components/integration-form";

/** The integration edit page. */
export default function IntegrationEdit(): ReactNode {
  const { query, onFinish, formLoading } = useForm<Integration>({
    resource: "integrations",
    action: "edit",
    redirect: "list",
  });

  const record = query?.data?.data;

  return (
    <EditView resource="integrations">
      {record ? (
        <IntegrationForm
          initialValues={record}
          isSubmitting={formLoading}
          submitLabel="Save changes"
          onSubmit={(values) => {
            void onFinish(toIntegrationPayload(values));
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
