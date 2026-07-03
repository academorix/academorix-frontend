/**
 * @file create.tsx
 * @module modules/sports/performance/pages/create
 *
 * @description
 * Performance-test create screen. `useForm` drives the mutation and redirects to
 * the list; the shared form builds the API payload (measured SDUI values start
 * empty — editing them is a documented follow-up).
 */

import { useForm } from "@refinedev/core";

import type { PerformanceTest } from "@/types";
import type { ReactNode } from "react";

import { CreateView } from "@/components/refine";
import { PerformanceForm } from "@/modules/sports/performance/components/performance-form";

/** The performance-test create page. */
export default function PerformanceCreate(): ReactNode {
  const { onFinish, formLoading } = useForm<PerformanceTest>({
    resource: "performance",
    action: "create",
    redirect: "list",
  });

  return (
    <CreateView resource="performance">
      <PerformanceForm isSubmitting={formLoading} onSubmit={(payload) => void onFinish(payload)} />
    </CreateView>
  );
}
