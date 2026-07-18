/**
 * @file edit.tsx
 * @module modules/sports/competition/pages/edit
 *
 * @description
 * Competition edit screen. Renders the shared form once the record has loaded.
 */

import { Spinner } from "@stackra/ui/react";
import { useForm } from "@refinedev/core";

import type { Competition } from "@/modules/sports/competition/competition.types";
import type { ReactNode } from "react";

import { EditView } from "@/components/refine";
import { useScope } from "@/lib/scope";
import {
  CompetitionForm,
  toCompetitionPayload,
} from "@/modules/sports/competition/components/competition-form";

/** The competition edit page. */
export default function CompetitionEdit(): ReactNode {
  const { scope } = useScope();
  const { query, onFinish, formLoading } = useForm<Competition>({
    resource: "competitions",
    action: "edit",
    redirect: "list",
  });

  const record = query?.data?.data;

  return (
    <EditView resource="competitions">
      {record ? (
        <CompetitionForm
          initialValues={record}
          isSubmitting={formLoading}
          submitLabel="Save changes"
          onSubmit={(values) => {
            void onFinish(toCompetitionPayload(values, scope));
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
