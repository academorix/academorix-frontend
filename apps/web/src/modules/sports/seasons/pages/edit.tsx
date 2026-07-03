/**
 * @file edit.tsx
 * @module modules/sports/seasons/pages/edit
 *
 * @description
 * Season edit screen. Renders the shared form once the record has loaded.
 */

import { Spinner } from "@academorix/ui/react";
import { useForm } from "@refinedev/core";

import type { Season } from "@/types";
import type { ReactNode } from "react";

import { EditView } from "@/components/refine";
import { SeasonForm, toSeasonPayload } from "@/modules/sports/seasons/components/season-form";

/** The season edit page. */
export default function SeasonEdit(): ReactNode {
  const { query, onFinish, formLoading } = useForm<Season>({
    resource: "seasons",
    action: "edit",
    redirect: "list",
  });

  const record = query?.data?.data;

  return (
    <EditView resource="seasons">
      {record ? (
        <SeasonForm
          initialValues={record}
          isSubmitting={formLoading}
          submitLabel="Save changes"
          onSubmit={(values) => {
            void onFinish(toSeasonPayload(values));
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
