/**
 * @file edit.tsx
 * @module modules/memberships/pages/edit
 *
 * @description
 * Membership edit screen. Renders the shared form once the record has loaded.
 */

import { Spinner } from "@academorix/ui/react";
import { useForm } from "@refinedev/core";

import type { Membership } from "@/types";
import type { ReactNode } from "react";

import { EditView } from "@/components/refine";
import { useScope } from "@/lib/scope";
import {
  MembershipForm,
  toMembershipPayload,
} from "@/modules/memberships/components/membership-form";

/** The membership edit page. */
export default function MembershipEdit(): ReactNode {
  const { scope } = useScope();
  const { query, onFinish, formLoading } = useForm<Membership>({
    resource: "memberships",
    action: "edit",
    redirect: "list",
  });

  const record = query?.data?.data;

  return (
    <EditView resource="memberships">
      {record ? (
        <MembershipForm
          initialValues={record}
          isSubmitting={formLoading}
          submitLabel="Save changes"
          onSubmit={(values) => {
            void onFinish(toMembershipPayload(values, scope.branchId));
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
