/**
 * @file create.tsx
 * @module modules/memberships/pages/create
 *
 * @description
 * Membership create screen. `useForm` drives the mutation and redirects to list.
 */

import { useForm } from "@refinedev/core";

import type { Membership } from "@/types";
import type { ReactNode } from "react";

import { CreateView } from "@/components/refine";
import { useScope } from "@/lib/scope";
import {
  MembershipForm,
  toMembershipPayload,
} from "@/modules/memberships/components/membership-form";

/** The membership create page. */
export default function MembershipCreate(): ReactNode {
  const { scope } = useScope();
  const { onFinish, formLoading } = useForm<Membership>({
    resource: "memberships",
    action: "create",
    redirect: "list",
  });

  return (
    <CreateView resource="memberships">
      <MembershipForm
        isSubmitting={formLoading}
        submitLabel="Create membership"
        onSubmit={(values) => {
          void onFinish(toMembershipPayload(values, scope.branchId));
        }}
      />
    </CreateView>
  );
}
