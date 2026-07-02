/**
 * @file edit.tsx
 * @module modules/athletes/pages/edit
 *
 * @description
 * Athlete edit screen (the resource's `edit` route). `useForm` fetches the
 * record (`query`) and drives the update mutation, redirecting to the list on
 * success. The shared {@link AthleteForm} is rendered once the record has
 * loaded, seeded with its current values; {@link EditView} supplies the header.
 */

import { useForm } from "@refinedev/core";

import type { Athlete } from "@/types";
import type { ReactNode } from "react";

import { EditView } from "@/components/refine";
import { AthleteForm, toAthletePayload } from "@/modules/athletes/components/athlete-form";
import { FormSkeleton } from "@/modules/athletes/components/form-skeleton";

/** The athlete edit page. */
export default function AthleteEdit(): ReactNode {
  const { query, onFinish, formLoading } = useForm<Athlete>({
    resource: "athletes",
    action: "edit",
    redirect: "list",
  });

  const record = query?.data?.data;

  return (
    <EditView resource="athletes">
      {record ? (
        <AthleteForm
          initialValues={record}
          isSubmitting={formLoading}
          submitLabel="Save changes"
          onSubmit={(values) => {
            void onFinish(toAthletePayload(values));
          }}
        />
      ) : (
        <FormSkeleton />
      )}
    </EditView>
  );
}
