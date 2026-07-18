/**
 * @file edit.tsx
 * @module modules/sports/matches/pages/edit
 *
 * @description
 * Match edit screen. Renders the shared form once the record has loaded; the
 * active scope supplies branch/season on the payload.
 */

import { Spinner } from "@stackra/ui/react";
import { useForm } from "@refinedev/core";

import type { Match } from "@/types";
import type { ReactNode } from "react";

import { EditView } from "@/components/refine";
import { useScope } from "@/lib/scope";
import { MatchForm, toMatchPayload } from "@/modules/sports/matches/components/match-form";

/** The match edit page. */
export default function MatchEdit(): ReactNode {
  const { scope } = useScope();
  const { query, onFinish, formLoading } = useForm<Match>({
    resource: "matches",
    action: "edit",
    redirect: "list",
  });

  const record = query?.data?.data;

  return (
    <EditView resource="matches">
      {record ? (
        <MatchForm
          initialValues={record}
          isSubmitting={formLoading}
          submitLabel="Save changes"
          onSubmit={(values) => {
            void onFinish(toMatchPayload(values, scope));
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
