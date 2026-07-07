/**
 * @file create.tsx
 * @module modules/facilities/pages/create
 *
 * @description
 * Facility create screen. `useForm` drives the mutation and redirects to the
 * list; the active scope's branch id is injected into the payload by
 * {@link toFacilityPayload} when the form leaves the branch field blank.
 */

import { useForm } from "@refinedev/core";

import type { Facility } from "@/modules/facilities/facilities.types";
import type { ReactNode } from "react";

import { CreateView } from "@/components/refine";
import { useScope } from "@/lib/scope";
import { FacilityForm, toFacilityPayload } from "@/modules/facilities/components/facility-form";

/** The facility create page. */
export default function FacilityCreate(): ReactNode {
  const { scope } = useScope();
  // `useForm` returns the submit callback + a `formLoading` flag we hand to
  // the form so the submit button can render its pending state.
  const { onFinish, formLoading } = useForm<Facility>({
    resource: "facilities",
    action: "create",
    redirect: "list",
  });

  return (
    <CreateView resource="facilities">
      <FacilityForm
        isSubmitting={formLoading}
        submitLabel="Create facility"
        onSubmit={(values) => {
          void onFinish(toFacilityPayload(values, scope));
        }}
      />
    </CreateView>
  );
}
