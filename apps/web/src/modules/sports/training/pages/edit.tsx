/**
 * @file edit.tsx
 * @module modules/sports/training/pages/edit
 *
 * @description
 * Training edit screen. Renders the shared form once the record has loaded; the
 * active scope supplies branch/season on the payload.
 */

import { Spinner } from "@academorix/ui/react";
import { useForm } from "@refinedev/core";

import type { TrainingSession } from "@/types";
import type { ReactNode } from "react";

import { EditView } from "@/components/refine";
import { useScope } from "@/lib/scope";
import {
  TrainingForm,
  toTrainingPayload,
} from "@/modules/sports/training/components/training-form";

/** The training edit page. */
export default function TrainingEdit(): ReactNode {
  const { scope } = useScope();
  const { query, onFinish, formLoading } = useForm<TrainingSession>({
    resource: "training-sessions",
    action: "edit",
    redirect: "list",
  });

  const record = query?.data?.data;

  return (
    <EditView resource="training-sessions">
      {record ? (
        <TrainingForm
          initialValues={record}
          isSubmitting={formLoading}
          submitLabel="Save changes"
          onSubmit={(values) => {
            void onFinish(toTrainingPayload(values, scope));
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
