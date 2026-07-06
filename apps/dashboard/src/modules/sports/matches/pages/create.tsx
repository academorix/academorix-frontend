/**
 * @file create.tsx
 * @module modules/sports/matches/pages/create
 *
 * @description
 * Match create screen. `useForm` drives the mutation and redirects to the list;
 * the active scope supplies branch/season on the payload.
 */

import { useForm } from "@refinedev/core";

import type { Match } from "@/types";
import type { ReactNode } from "react";

import { CreateView } from "@/components/refine";
import { useScope } from "@/lib/scope";
import { MatchForm, toMatchPayload } from "@/modules/sports/matches/components/match-form";

/** The match create page. */
export default function MatchCreate(): ReactNode {
  const { scope } = useScope();
  const { onFinish, formLoading } = useForm<Match>({
    resource: "matches",
    action: "create",
    redirect: "list",
  });

  return (
    <CreateView resource="matches">
      <MatchForm
        isSubmitting={formLoading}
        submitLabel="Create match"
        onSubmit={(values) => {
          void onFinish(toMatchPayload(values, scope));
        }}
      />
    </CreateView>
  );
}
