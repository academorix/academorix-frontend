/**
 * @file create.tsx
 * @module modules/sports/awards/pages/create
 *
 * @description
 * Award create screen. `useForm` drives the mutation and redirects to the list;
 * the shared form builds the API payload.
 */

import { useForm } from "@refinedev/core";

import type { Award } from "@/types";
import type { ReactNode } from "react";

import { CreateView } from "@/components/refine";
import { AwardForm } from "@/modules/sports/awards/components/award-form";

/** The award create page. */
export default function AwardsCreate(): ReactNode {
  const { onFinish, formLoading } = useForm<Award>({
    resource: "awards",
    action: "create",
    redirect: "list",
  });

  return (
    <CreateView resource="awards">
      <AwardForm isSubmitting={formLoading} onSubmit={(payload) => void onFinish(payload)} />
    </CreateView>
  );
}
