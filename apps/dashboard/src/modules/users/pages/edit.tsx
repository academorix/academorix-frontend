/**
 * @file edit.tsx
 * @module modules/users/pages/edit
 *
 * @description
 * User edit screen. Renders the shared form once the record has loaded.
 */

import { Spinner } from "@stackra/ui/react";
import { useForm } from "@refinedev/core";

import type { User } from "@/types";
import type { ReactNode } from "react";

import { EditView } from "@/components/refine";
import { UserForm, toUserPayload } from "@/modules/users/components/user-form";

/** The user edit page. */
export default function UserEdit(): ReactNode {
  const { query, onFinish, formLoading } = useForm<User>({
    resource: "users",
    action: "edit",
    redirect: "list",
  });

  const record = query?.data?.data;

  return (
    <EditView resource="users">
      {record ? (
        <UserForm
          initialValues={record}
          isSubmitting={formLoading}
          submitLabel="Save changes"
          onSubmit={(values) => {
            void onFinish(toUserPayload(values));
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
