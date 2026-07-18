/**
 * @file edit.tsx
 * @module modules/facilities/pages/edit
 *
 * @description
 * Facility edit screen. Renders the shared form once the record has loaded.
 */

import { Spinner } from "@stackra/ui/react";
import { useForm } from "@refinedev/core";

import type { Facility } from "@/modules/facilities/facilities.types";
import type { ReactNode } from "react";

import { EditView } from "@/components/refine";
import { useScope } from "@/lib/scope";
import { FacilityForm, toFacilityPayload } from "@/modules/facilities/components/facility-form";

/** The facility edit page. */
export default function FacilityEdit(): ReactNode {
  const { scope } = useScope();
  // `useForm` loads the record (in `query.data.data`) and returns the submit
  // callback we hand to the shared form.
  const { query, onFinish, formLoading } = useForm<Facility>({
    resource: "facilities",
    action: "edit",
    redirect: "list",
  });

  const record = query?.data?.data;

  return (
    <EditView resource="facilities">
      {record ? (
        <FacilityForm
          initialValues={record}
          isSubmitting={formLoading}
          submitLabel="Save changes"
          onSubmit={(values) => {
            void onFinish(toFacilityPayload(values, scope));
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
