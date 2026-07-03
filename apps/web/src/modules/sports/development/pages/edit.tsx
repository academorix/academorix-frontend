/**
 * @file edit.tsx
 * @module modules/sports/development/pages/edit
 *
 * @description
 * Development-plan edit screen. Renders the shared form once the record loads.
 */

import { Spinner } from "@academorix/ui/react";
import { useForm } from "@refinedev/core";

import type { DevelopmentPlan } from "@/modules/sports/development/development.types";
import type { ReactNode } from "react";

import { EditView } from "@/components/refine";
import {
  DevelopmentForm,
  toDevelopmentPayload,
} from "@/modules/sports/development/components/development-form";

/** The development-plan edit page. */
export default function DevelopmentEdit(): ReactNode {
  const { query, onFinish, formLoading } = useForm<DevelopmentPlan>({
    resource: "development",
    action: "edit",
    redirect: "list",
  });

  const record = query?.data?.data;

  return (
    <EditView resource="development">
      {record ? (
        <DevelopmentForm
          initialValues={record}
          isSubmitting={formLoading}
          submitLabel="Save changes"
          onSubmit={(values) => {
            void onFinish(toDevelopmentPayload(values));
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
