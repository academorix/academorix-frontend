/**
 * @file create.tsx
 * @module modules/sports/formations/pages/create
 *
 * @description
 * Formation create screen. `useForm` drives the mutation and redirects to the
 * list; the active scope supplies the organization/branch. The shared form seeds
 * an empty slot layout that the coach fills in with the on-pitch slot editor.
 */

import { useForm } from "@refinedev/core";

import type { Formation } from "@/modules/sports/formations/formation.types";
import type { ReactNode } from "react";

import { CreateView } from "@/components/refine";
import { useScope } from "@/lib/scope";
import {
  FormationForm,
  toFormationPayload,
} from "@/modules/sports/formations/components/formation-form";

/** The formation create page. */
export default function FormationCreate(): ReactNode {
  const { scope } = useScope();
  const { onFinish, formLoading } = useForm<Formation>({
    resource: "formations",
    action: "create",
    redirect: "list",
  });

  return (
    <CreateView resource="formations">
      <FormationForm
        isSubmitting={formLoading}
        submitLabel="Create formation"
        onSubmit={(values) => {
          void onFinish(toFormationPayload(values, scope));
        }}
      />
    </CreateView>
  );
}
