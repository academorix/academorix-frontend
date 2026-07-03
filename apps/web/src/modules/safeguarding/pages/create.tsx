/**
 * @file create.tsx
 * @module modules/safeguarding/pages/create
 *
 * @description
 * Safeguarding-case create screen. `useForm` drives the mutation and redirects
 * to the list; the shared form builds the API payload and injects the active
 * organization/branch from scope. Sensitive data, gated by the `safeguarding`
 * permission.
 */

import { useForm } from "@refinedev/core";

import type { SafeguardingCase } from "@/modules/safeguarding/safeguarding.types";
import type { ReactNode } from "react";

import { CreateView } from "@/components/refine";
import { SafeguardingForm } from "@/modules/safeguarding/components/safeguarding-form";

/** The safeguarding-case create page. */
export default function SafeguardingCreate(): ReactNode {
  const { onFinish, formLoading } = useForm<SafeguardingCase>({
    resource: "safeguarding",
    action: "create",
    redirect: "list",
  });

  return (
    <CreateView resource="safeguarding">
      <SafeguardingForm isSubmitting={formLoading} onSubmit={(payload) => void onFinish(payload)} />
    </CreateView>
  );
}
