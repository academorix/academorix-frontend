/**
 * @file edit.tsx
 * @module modules/sports/formations/pages/edit
 *
 * @description
 * Formation edit screen. Renders the shared form once the record has loaded; the
 * form seeds its metadata and on-pitch slots from the record, so the payload is
 * built from the edited form values alone.
 */

import { Spinner } from "@academorix/ui/react";
import { useForm } from "@refinedev/core";

import type { Formation } from "@/modules/sports/formations/formation.types";
import type { ReactNode } from "react";

import { EditView } from "@/components/refine";
import { useScope } from "@/lib/scope";
import {
  FormationForm,
  toFormationPayload,
} from "@/modules/sports/formations/components/formation-form";

/** The formation edit page. */
export default function FormationEdit(): ReactNode {
  const { scope } = useScope();
  const { query, onFinish, formLoading } = useForm<Formation>({
    resource: "formations",
    action: "edit",
    redirect: "list",
  });

  const record = query?.data?.data;

  return (
    <EditView resource="formations">
      {record ? (
        <FormationForm
          initialValues={record}
          isSubmitting={formLoading}
          submitLabel="Save changes"
          onSubmit={(values) => {
            void onFinish(toFormationPayload(values, scope));
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
