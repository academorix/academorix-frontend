/**
 * @file edit.tsx
 * @module modules/staff/pages/edit
 *
 * @description
 * Staff edit screen. Renders the shared form once the record has loaded.
 */

import { Spinner } from "@stackra/ui/react";
import { useForm } from "@refinedev/core";

import type { Staff } from "@/types";
import type { ReactNode } from "react";

import { EditView } from "@/components/refine";
import { useScope } from "@/lib/scope";
import { StaffForm, toStaffPayload } from "@/modules/staff/components/staff-form";

/** The staff edit page. */
export default function StaffEdit(): ReactNode {
  const { scope } = useScope();
  const { query, onFinish, formLoading } = useForm<Staff>({
    resource: "staff",
    action: "edit",
    redirect: "list",
  });

  const record = query?.data?.data;

  return (
    <EditView resource="staff">
      {record ? (
        <StaffForm
          initialValues={record}
          isSubmitting={formLoading}
          submitLabel="Save changes"
          onSubmit={(values) => {
            void onFinish(toStaffPayload(values, scope.branchId));
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
