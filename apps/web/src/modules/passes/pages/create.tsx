/**
 * @file create.tsx
 * @module modules/passes/pages/create
 *
 * @description
 * Pass create screen. `useForm` drives the mutation and redirects to the list;
 * the active scope supplies the organization/branch on the payload.
 */

import { useForm } from "@refinedev/core";

import type { Pass } from "@/modules/passes/passes.types";
import type { ReactNode } from "react";

import { CreateView } from "@/components/refine";
import { useScope } from "@/lib/scope";
import { PassForm, toPassPayload } from "@/modules/passes/components/pass-form";

/** The pass create page. */
export default function PassCreate(): ReactNode {
  const { scope } = useScope();
  const { onFinish, formLoading } = useForm<Pass>({
    resource: "passes",
    action: "create",
    redirect: "list",
  });

  return (
    <CreateView resource="passes">
      <PassForm
        isSubmitting={formLoading}
        submitLabel="Create pass"
        onSubmit={(values) => {
          void onFinish(toPassPayload(values, scope));
        }}
      />
    </CreateView>
  );
}
