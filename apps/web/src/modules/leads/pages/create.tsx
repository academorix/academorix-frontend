/**
 * @file create.tsx
 * @module modules/leads/pages/create
 *
 * @description
 * Lead create screen. `useForm` drives the mutation and redirects to the list;
 * the active scope supplies the organization/branch on the payload.
 */

import { useForm } from "@refinedev/core";

import type { Lead } from "@/modules/leads/leads.types";
import type { ReactNode } from "react";

import { CreateView } from "@/components/refine";
import { useScope } from "@/lib/scope";
import { LeadForm, toLeadPayload } from "@/modules/leads/components/lead-form";

/** The lead create page. */
export default function LeadCreate(): ReactNode {
  const { scope } = useScope();
  const { onFinish, formLoading } = useForm<Lead>({
    resource: "leads",
    action: "create",
    redirect: "list",
  });

  return (
    <CreateView resource="leads">
      <LeadForm
        isSubmitting={formLoading}
        submitLabel="Create lead"
        onSubmit={(values) => {
          void onFinish(toLeadPayload(values, scope));
        }}
      />
    </CreateView>
  );
}
