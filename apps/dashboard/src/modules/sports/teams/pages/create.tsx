/**
 * @file create.tsx
 * @module modules/sports/teams/pages/create
 *
 * @description
 * Team create screen. `useForm` drives the mutation and redirects to the list.
 */

import { useForm } from "@refinedev/core";

import type { Team } from "@/types";
import type { ReactNode } from "react";

import { CreateView } from "@/components/refine";
import { TeamForm, toTeamPayload } from "@/modules/sports/teams/components/team-form";

/** The team create page. */
export default function TeamCreate(): ReactNode {
  const { onFinish, formLoading } = useForm<Team>({
    resource: "teams",
    action: "create",
    redirect: "list",
  });

  return (
    <CreateView resource="teams">
      <TeamForm
        isSubmitting={formLoading}
        submitLabel="Create team"
        onSubmit={(values) => {
          void onFinish(toTeamPayload(values));
        }}
      />
    </CreateView>
  );
}
