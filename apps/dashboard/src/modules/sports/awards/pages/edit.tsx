/**
 * @file edit.tsx
 * @module modules/sports/awards/pages/edit
 *
 * @description
 * Award edit screen. Renders the shared form once the record has loaded.
 */

import { Spinner } from "@academorix/ui/react";
import { useForm } from "@refinedev/core";

import type { Award } from "@/types";
import type { ReactNode } from "react";

import { EditView } from "@/components/refine";
import { AwardForm } from "@/modules/sports/awards/components/award-form";

/** The award edit page. */
export default function AwardsEdit(): ReactNode {
  const { query, onFinish, formLoading } = useForm<Award>({
    resource: "awards",
    action: "edit",
    redirect: "list",
  });

  const record = query?.data?.data;

  return (
    <EditView resource="awards">
      {record ? (
        <AwardForm
          initialValues={record}
          isSubmitting={formLoading}
          onSubmit={(payload) => void onFinish(payload)}
        />
      ) : (
        <div className="flex h-40 items-center justify-center">
          <Spinner aria-label="Loading" />
        </div>
      )}
    </EditView>
  );
}
