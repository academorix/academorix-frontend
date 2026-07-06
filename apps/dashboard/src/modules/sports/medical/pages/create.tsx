/**
 * @file create.tsx
 * @module modules/sports/medical/pages/create
 *
 * @description
 * Medical-record create screen. `useForm` drives the mutation and redirects to
 * the list; the shared form builds the API payload. Sensitive data, gated by the
 * `medical` permission.
 */

import { useForm } from "@refinedev/core";

import type { MedicalRecord } from "@/types";
import type { ReactNode } from "react";

import { CreateView } from "@/components/refine";
import { MedicalForm } from "@/modules/sports/medical/components/medical-form";

/** The medical-record create page. */
export default function MedicalCreate(): ReactNode {
  const { onFinish, formLoading } = useForm<MedicalRecord>({
    resource: "medical",
    action: "create",
    redirect: "list",
  });

  return (
    <CreateView resource="medical">
      <MedicalForm isSubmitting={formLoading} onSubmit={(payload) => void onFinish(payload)} />
    </CreateView>
  );
}
