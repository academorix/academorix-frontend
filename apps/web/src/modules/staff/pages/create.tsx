/**
 * @file create.tsx
 * @module modules/staff/pages/create
 *
 * @description
 * Staff create screen. `useForm` drives the mutation and redirects to the list.
 */

import { useForm } from "@refinedev/core";

import type { Staff } from "@/types";
import type { ReactNode } from "react";

import { CreateView } from "@/components/refine";
import { useScope } from "@/lib/scope";
import { StaffForm, toStaffPayload } from "@/modules/staff/components/staff-form";

/** The staff create page. */
export default function StaffCreate(): ReactNode {
  const { scope } = useScope();
  const { onFinish, formLoading } = useForm<Staff>({
    resource: "staff",
    action: "create",
    redirect: "list",
  });

  return (
    <CreateView resource="staff">
      <StaffForm
        isSubmitting={formLoading}
        submitLabel="Create staff"
        onSubmit={(values) => {
          void onFinish(toStaffPayload(values, scope.branchId));
        }}
      />
    </CreateView>
  );
}
