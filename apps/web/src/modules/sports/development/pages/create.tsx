/**
 * @file create.tsx
 * @module modules/sports/development/pages/create
 *
 * @description
 * Development-plan create screen. `useForm` drives the mutation and redirects to
 * the list on success.
 */

import { useForm } from "@refinedev/core";

import type { DevelopmentPlan } from "@/modules/sports/development/development.types";
import type { ReactNode } from "react";

import { CreateView } from "@/components/refine";
import {
  DevelopmentForm,
  toDevelopmentPayload,
} from "@/modules/sports/development/components/development-form";

/** The development-plan create page. */
export default function DevelopmentCreate(): ReactNode {
  const { onFinish, formLoading } = useForm<DevelopmentPlan>({
    resource: "development",
    action: "create",
    redirect: "list",
  });

  return (
    <CreateView resource="development">
      <DevelopmentForm
        isSubmitting={formLoading}
        submitLabel="Create plan"
        onSubmit={(values) => {
          void onFinish(toDevelopmentPayload(values));
        }}
      />
    </CreateView>
  );
}
