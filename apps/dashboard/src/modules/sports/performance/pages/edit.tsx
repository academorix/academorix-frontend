/**
 * @file edit.tsx
 * @module modules/sports/performance/pages/edit
 *
 * @description
 * Performance-test edit screen. Renders the shared form once the record has
 * loaded; the record's existing measured (`attributes`) values are loaded into
 * the shared form's live SDUI editor.
 */

import { Spinner } from "@stackra/ui/react";
import { useForm } from "@refinedev/core";

import type { PerformanceTest } from "@/types";
import type { ReactNode } from "react";

import { EditView } from "@/components/refine";
import { PerformanceForm } from "@/modules/sports/performance/components/performance-form";

/** The performance-test edit page. */
export default function PerformanceEdit(): ReactNode {
  const { query, onFinish, formLoading } = useForm<PerformanceTest>({
    resource: "performance",
    action: "edit",
    redirect: "list",
  });

  const record = query?.data?.data;

  return (
    <EditView resource="performance">
      {record ? (
        <PerformanceForm
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
