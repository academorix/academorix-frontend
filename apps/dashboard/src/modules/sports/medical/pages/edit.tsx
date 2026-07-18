/**
 * @file edit.tsx
 * @module modules/sports/medical/pages/edit
 *
 * @description
 * Medical-record edit screen. Renders the shared form once the record has
 * loaded. Sensitive data, gated by the `medical` permission.
 */

import { Spinner } from "@stackra/ui/react";
import { useForm } from "@refinedev/core";

import type { MedicalRecord } from "@/types";
import type { ReactNode } from "react";

import { EditView } from "@/components/refine";
import { MedicalForm } from "@/modules/sports/medical/components/medical-form";

/** The medical-record edit page. */
export default function MedicalEdit(): ReactNode {
  const { query, onFinish, formLoading } = useForm<MedicalRecord>({
    resource: "medical",
    action: "edit",
    redirect: "list",
  });

  const record = query?.data?.data;

  return (
    <EditView resource="medical">
      {record ? (
        <MedicalForm
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
