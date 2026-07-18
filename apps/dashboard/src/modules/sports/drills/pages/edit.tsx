/**
 * @file edit.tsx
 * @module modules/sports/drills/pages/edit
 *
 * @description
 * Drill edit screen. Renders the shared form once the record has loaded.
 */

import { Spinner } from "@stackra/ui/react";
import { useForm } from "@refinedev/core";

import type { Drill } from "@/types";
import type { ReactNode } from "react";

import { EditView } from "@/components/refine";
import { DrillForm, toDrillPayload } from "@/modules/sports/drills/components/drill-form";

/** The drill edit page. */
export default function DrillEdit(): ReactNode {
  const { query, onFinish, formLoading } = useForm<Drill>({
    resource: "drills",
    action: "edit",
    redirect: "list",
  });

  const record = query?.data?.data;

  return (
    <EditView resource="drills">
      {record ? (
        <DrillForm
          initialValues={record}
          isSubmitting={formLoading}
          submitLabel="Save changes"
          onSubmit={(values) => {
            void onFinish(toDrillPayload(values));
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
