/**
 * @file create.tsx
 * @module modules/sports/sessions/pages/create
 *
 * @description
 * Private session create screen. `useForm` drives the mutation and redirects to
 * the list; the active scope supplies branch/season on the payload.
 */

import { useForm } from "@refinedev/core";

import type { PrivateSession } from "@/types";
import type { ReactNode } from "react";

import { CreateView } from "@/components/refine";
import { useScope } from "@/lib/scope";
import { SessionForm, toSessionPayload } from "@/modules/sports/sessions/components/session-form";

/** The private session create page. */
export default function SessionCreate(): ReactNode {
  const { scope } = useScope();
  const { onFinish, formLoading } = useForm<PrivateSession>({
    resource: "private-sessions",
    action: "create",
    redirect: "list",
  });

  return (
    <CreateView resource="private-sessions">
      <SessionForm
        isSubmitting={formLoading}
        submitLabel="Create session"
        onSubmit={(values) => {
          void onFinish(toSessionPayload(values, scope));
        }}
      />
    </CreateView>
  );
}
