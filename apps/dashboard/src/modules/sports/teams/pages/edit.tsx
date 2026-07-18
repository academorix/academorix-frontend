/**
 * @file edit.tsx
 * @module modules/sports/teams/pages/edit
 *
 * @description
 * Team edit screen. Renders the shared form once the record has loaded.
 */

import { Spinner } from "@stackra/ui/react";
import { useForm } from "@refinedev/core";

import type { Team } from "@/types";
import type { ReactNode } from "react";

import { EditView } from "@/components/refine";
import { TeamForm, toTeamPayload } from "@/modules/sports/teams/components/team-form";

/** The team edit page. */
export default function TeamEdit(): ReactNode {
  const { query, onFinish, formLoading } = useForm<Team>({
    resource: "teams",
    action: "edit",
    redirect: "list",
  });

  const record = query?.data?.data;

  return (
    <EditView resource="teams">
      {record ? (
        <TeamForm
          initialValues={record}
          isSubmitting={formLoading}
          submitLabel="Save changes"
          onSubmit={(values) => {
            void onFinish(toTeamPayload(values));
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
