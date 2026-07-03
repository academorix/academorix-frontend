/**
 * @file create.tsx
 * @module modules/users/pages/create
 *
 * @description
 * User create screen. `useForm` drives the mutation and redirects to the list.
 */

import { useForm } from "@refinedev/core";

import type { User } from "@/types";
import type { ReactNode } from "react";

import { CreateView } from "@/components/refine";
import { UserForm, toUserPayload } from "@/modules/users/components/user-form";

/** The user create page. */
export default function UserCreate(): ReactNode {
  const { onFinish, formLoading } = useForm<User>({
    resource: "users",
    action: "create",
    redirect: "list",
  });

  return (
    <CreateView resource="users">
      <UserForm
        isSubmitting={formLoading}
        submitLabel="Create user"
        onSubmit={(values) => {
          void onFinish(toUserPayload(values));
        }}
      />
    </CreateView>
  );
}
