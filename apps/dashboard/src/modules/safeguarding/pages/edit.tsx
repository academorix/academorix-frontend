/**
 * @file edit.tsx
 * @module modules/safeguarding/pages/edit
 *
 * @description
 * Safeguarding-case edit screen. Renders the shared form once the record has
 * loaded. Sensitive data, gated by the `safeguarding` permission.
 */

import { Spinner } from "@academorix/ui/react";
import { useForm } from "@refinedev/core";

import type { SafeguardingCase } from "@/modules/safeguarding/safeguarding.types";
import type { ReactNode } from "react";

import { EditView } from "@/components/refine";
import { SafeguardingForm } from "@/modules/safeguarding/components/safeguarding-form";

/** The safeguarding-case edit page. */
export default function SafeguardingEdit(): ReactNode {
  const { query, onFinish, formLoading } = useForm<SafeguardingCase>({
    resource: "safeguarding",
    action: "edit",
    redirect: "list",
  });

  const record = query?.data?.data;

  return (
    <EditView resource="safeguarding">
      {record ? (
        <SafeguardingForm
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
