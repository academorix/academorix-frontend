/**
 * @file create.tsx
 * @module modules/sports/training/pages/create
 *
 * @description
 * Training create screen. `useForm` drives the mutation and redirects to the
 * list; the active scope supplies branch/season on the payload.
 */

import { useForm } from "@refinedev/core";

import type { TrainingSession } from "@/types";
import type { ReactNode } from "react";

import { CreateView } from "@/components/refine";
import { useScope } from "@/lib/scope";
import {
  TrainingForm,
  toTrainingPayload,
} from "@/modules/sports/training/components/training-form";

/** The training create page. */
export default function TrainingCreate(): ReactNode {
  const { scope } = useScope();
  const { onFinish, formLoading } = useForm<TrainingSession>({
    resource: "training-sessions",
    action: "create",
    redirect: "list",
  });

  return (
    <CreateView resource="training-sessions">
      <TrainingForm
        isSubmitting={formLoading}
        submitLabel="Create session"
        onSubmit={(values) => {
          void onFinish(toTrainingPayload(values, scope));
        }}
      />
    </CreateView>
  );
}
