/**
 * @file edit.tsx
 * @module modules/branches/pages/edit
 *
 * @description
 * Branch edit screen. Renders the shared form once the record has loaded.
 */

import { Spinner } from "@academorix/ui/react";
import { useForm } from "@refinedev/core";

import type { Branch } from "@/types";
import type { ReactNode } from "react";

import { EditView } from "@/components/refine";
import { BranchForm, toBranchPayload } from "@/modules/branches/components/branch-form";

/** The branch edit page. */
export default function BranchEdit(): ReactNode {
  const { query, onFinish, formLoading } = useForm<Branch>({
    resource: "branches",
    action: "edit",
    redirect: "list",
  });

  const record = query?.data?.data;

  return (
    <EditView resource="branches">
      {record ? (
        <BranchForm
          initialValues={record}
          isSubmitting={formLoading}
          submitLabel="Save changes"
          onSubmit={(values) => {
            void onFinish(toBranchPayload(values));
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
