/**
 * @file create.tsx
 * @module modules/athletes/pages/create
 *
 * @description
 * Athlete create screen (the resource's `create` route). Refine's headless
 * `useForm` drives the mutation and redirects to the list on success; the
 * shared {@link AthleteForm} collects the values and {@link CreateView} supplies
 * the header + actions.
 */

import { useForm } from "@refinedev/core";

import type { Athlete } from "@/types";
import type { ReactNode } from "react";

import { CreateView } from "@/components/refine";
import { AthleteForm, toAthletePayload } from "@/modules/athletes/components/athlete-form";

/** The athlete create page. */
export default function AthleteCreate(): ReactNode {
  const { onFinish, formLoading } = useForm<Athlete>({
    resource: "athletes",
    action: "create",
    redirect: "list",
  });

  return (
    <CreateView resource="athletes">
      <AthleteForm
        isSubmitting={formLoading}
        submitLabel="Create athlete"
        onSubmit={(values) => {
          void onFinish(toAthletePayload(values));
        }}
      />
    </CreateView>
  );
}
