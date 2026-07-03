/**
 * @file create.tsx
 * @module modules/sports/competition/pages/create
 *
 * @description
 * Competition create screen. `useForm` drives the mutation and redirects to the
 * list; the active scope supplies the organization/branch on the payload.
 */

import { useForm } from "@refinedev/core";

import type { Competition } from "@/modules/sports/competition/competition.types";
import type { ReactNode } from "react";

import { CreateView } from "@/components/refine";
import { useScope } from "@/lib/scope";
import {
  CompetitionForm,
  toCompetitionPayload,
} from "@/modules/sports/competition/components/competition-form";

/** The competition create page. */
export default function CompetitionCreate(): ReactNode {
  const { scope } = useScope();
  const { onFinish, formLoading } = useForm<Competition>({
    resource: "competitions",
    action: "create",
    redirect: "list",
  });

  return (
    <CreateView resource="competitions">
      <CompetitionForm
        isSubmitting={formLoading}
        submitLabel="Create competition"
        onSubmit={(values) => {
          void onFinish(toCompetitionPayload(values, scope));
        }}
      />
    </CreateView>
  );
}
