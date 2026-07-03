/**
 * @file create.tsx
 * @module modules/integrations/pages/create
 *
 * @description
 * Integration create screen. `useForm` drives the mutation and redirects to the
 * list. Integrations are tenant-level, so no scope is injected.
 */

import { useForm } from "@refinedev/core";

import type { Integration } from "@/modules/integrations/integrations.types";
import type { ReactNode } from "react";

import { CreateView } from "@/components/refine";
import {
  IntegrationForm,
  toIntegrationPayload,
} from "@/modules/integrations/components/integration-form";

/** The integration create page. */
export default function IntegrationCreate(): ReactNode {
  const { onFinish, formLoading } = useForm<Integration>({
    resource: "integrations",
    action: "create",
    redirect: "list",
  });

  return (
    <CreateView resource="integrations">
      <IntegrationForm
        isSubmitting={formLoading}
        submitLabel="Create integration"
        onSubmit={(values) => {
          void onFinish(toIntegrationPayload(values));
        }}
      />
    </CreateView>
  );
}
