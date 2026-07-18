/**
 * @file edit.tsx
 * @module modules/sports/sessions/pages/edit
 *
 * @description
 * Private session edit screen. Renders the shared form once the record has
 * loaded; the active scope supplies branch/season on the payload.
 */

import { Spinner } from "@stackra/ui/react";
import { useForm } from "@refinedev/core";

import type { PrivateSession } from "@/types";
import type { ReactNode } from "react";

import { EditView } from "@/components/refine";
import { useScope } from "@/lib/scope";
import { SessionForm, toSessionPayload } from "@/modules/sports/sessions/components/session-form";

/** The private session edit page. */
export default function SessionEdit(): ReactNode {
  const { scope } = useScope();
  const { query, onFinish, formLoading } = useForm<PrivateSession>({
    resource: "private-sessions",
    action: "edit",
    redirect: "list",
  });

  const record = query?.data?.data;

  return (
    <EditView resource="private-sessions">
      {record ? (
        <SessionForm
          initialValues={record}
          isSubmitting={formLoading}
          submitLabel="Save changes"
          onSubmit={(values) => {
            void onFinish(toSessionPayload(values, scope));
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
