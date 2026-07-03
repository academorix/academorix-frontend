/**
 * @file edit.tsx
 * @module modules/passes/pages/edit
 *
 * @description
 * Pass edit screen. Renders the shared form once the record has loaded.
 */

import { Spinner } from "@academorix/ui/react";
import { useForm } from "@refinedev/core";

import type { Pass } from "@/modules/passes/passes.types";
import type { ReactNode } from "react";

import { EditView } from "@/components/refine";
import { useScope } from "@/lib/scope";
import { PassForm, toPassPayload } from "@/modules/passes/components/pass-form";

/** The pass edit page. */
export default function PassEdit(): ReactNode {
  const { scope } = useScope();
  const { query, onFinish, formLoading } = useForm<Pass>({
    resource: "passes",
    action: "edit",
    redirect: "list",
  });

  const record = query?.data?.data;

  return (
    <EditView resource="passes">
      {record ? (
        <PassForm
          initialValues={record}
          isSubmitting={formLoading}
          submitLabel="Save changes"
          onSubmit={(values) => {
            void onFinish(toPassPayload(values, scope));
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
