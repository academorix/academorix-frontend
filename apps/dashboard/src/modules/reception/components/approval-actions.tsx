/**
 * @file approval-actions.tsx
 * @module modules/reception/components/approval-actions
 *
 * @description
 * Approve/Reject controls for a pending approval task, patching its status via
 * Refine's `useUpdate`. Renders nothing once the task is resolved.
 */

import { CheckIcon, XMarkIcon } from "@stackra/ui/icons/heroicon/outline";
import { Button } from "@stackra/ui/react";
import { useUpdate } from "@refinedev/core";

import type { ApprovalTask } from "@/modules/reception/reception.types";
import type { ReactNode } from "react";

/** Inline approve/reject buttons for a reception approval task. */
export function ApprovalActions({ task }: { task: ApprovalTask }): ReactNode {
  const { mutate: update } = useUpdate();

  if (task.status !== "pending") {
    return null;
  }

  const setStatus = (status: "approved" | "rejected"): void => {
    update({ resource: "approval-tasks", id: task.id, values: { status } });
  };

  return (
    <div className="flex justify-end gap-1">
      <Button
        isIconOnly
        aria-label="Approve"
        size="sm"
        variant="secondary"
        onPress={() => setStatus("approved")}
      >
        <CheckIcon aria-hidden="true" className="size-4" />
      </Button>
      <Button
        isIconOnly
        aria-label="Reject"
        size="sm"
        variant="danger"
        onPress={() => setStatus("rejected")}
      >
        <XMarkIcon aria-hidden="true" className="size-4" />
      </Button>
    </div>
  );
}
