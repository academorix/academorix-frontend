/**
 * @file create.tsx
 * @module modules/sports/seasons/pages/create
 *
 * @description
 * Season create screen. `useForm` drives the mutation and redirects to the list.
 */

import { useForm } from "@refinedev/core";

import type { Season } from "@/types";
import type { ReactNode } from "react";

import { CreateView } from "@/components/refine";
import { SeasonForm, toSeasonPayload } from "@/modules/sports/seasons/components/season-form";

/** The season create page. */
export default function SeasonCreate(): ReactNode {
  const { onFinish, formLoading } = useForm<Season>({
    resource: "seasons",
    action: "create",
    redirect: "list",
  });

  return (
    <CreateView resource="seasons">
      <SeasonForm
        isSubmitting={formLoading}
        submitLabel="Create season"
        onSubmit={(values) => {
          void onFinish(toSeasonPayload(values));
        }}
      />
    </CreateView>
  );
}
