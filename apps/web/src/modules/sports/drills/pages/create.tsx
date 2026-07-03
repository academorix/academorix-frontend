/**
 * @file create.tsx
 * @module modules/sports/drills/pages/create
 *
 * @description
 * Drill create screen. `useForm` drives the mutation and redirects to the list.
 */

import { useForm } from "@refinedev/core";

import type { Drill } from "@/types";
import type { ReactNode } from "react";

import { CreateView } from "@/components/refine";
import { DrillForm, toDrillPayload } from "@/modules/sports/drills/components/drill-form";

/** The drill create page. */
export default function DrillCreate(): ReactNode {
  const { onFinish, formLoading } = useForm<Drill>({
    resource: "drills",
    action: "create",
    redirect: "list",
  });

  return (
    <CreateView resource="drills">
      <DrillForm
        isSubmitting={formLoading}
        submitLabel="Create drill"
        onSubmit={(values) => {
          void onFinish(toDrillPayload(values));
        }}
      />
    </CreateView>
  );
}
