/**
 * @file create.tsx
 * @module modules/branches/pages/create
 *
 * @description
 * Branch create screen. `useForm` drives the mutation and redirects to the list.
 */

import { useForm } from "@refinedev/core";

import type { Branch } from "@/types";
import type { ReactNode } from "react";

import { CreateView } from "@/components/refine";
import { BranchForm, toBranchPayload } from "@/modules/branches/components/branch-form";

/** The branch create page. */
export default function BranchCreate(): ReactNode {
  const { onFinish, formLoading } = useForm<Branch>({
    resource: "branches",
    action: "create",
    redirect: "list",
  });

  return (
    <CreateView resource="branches">
      <BranchForm
        isSubmitting={formLoading}
        submitLabel="Create branch"
        onSubmit={(values) => {
          void onFinish(toBranchPayload(values));
        }}
      />
    </CreateView>
  );
}
