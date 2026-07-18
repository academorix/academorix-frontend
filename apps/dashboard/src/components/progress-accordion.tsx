/**
 * @file progress-accordion.tsx
 * @module components/progress-accordion
 *
 * @description
 * The `progress-accordion` container per §7.2. Wraps `DisclosureGroup` with
 * per-step status chips and a submit gate. Use for variable-step forms
 * where steps have dependencies (invoice creation with line items, athlete
 * onboarding with 6+ sections). For fixed-step flows use `<ProgressTabs>`.
 */

import { Button, Chip, Disclosure, DisclosureGroup, Separator } from "@heroui/react";
import { useState } from "react";

import type { ReactNode } from "react";

import { Iconify } from "@/icons/iconify";

import type { ProgressStep } from "./progress-tabs";

type ProgressAccordionProps = {
  steps: ProgressStep[];
  submitLabel?: string;
  isSubmitting?: boolean;
  onSubmit: () => void;
  onCancel?: () => void;
  className?: string;
  /**
   * When `true`, marks steps as blocked until every prior step is `complete`.
   * When `false`, users can jump freely between steps.
   */
  isSequential?: boolean;
};

const STATUS_COLOR = {
  "not-started": "default",
  "in-progress": "warning",
  complete: "success",
  error: "danger",
} as const;

const STATUS_ICON: Record<ProgressStep["status"] & string, string> = {
  "not-started": "circle",
  "in-progress": "hourglass",
  complete: "circle-check-fill",
  error: "circle-xmark-fill",
};

export function ProgressAccordion({
  steps,
  submitLabel = "Submit",
  isSubmitting,
  onSubmit,
  onCancel,
  className,
  isSequential = false,
}: ProgressAccordionProps): ReactNode {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(
    () => new Set(steps[0] ? [steps[0].id] : []),
  );

  const allRequiredComplete = steps
    .filter((s) => s.isRequired !== false)
    .every((s) => s.status === "complete");

  const stepIsBlocked = (index: number): boolean => {
    if (!isSequential) return false;

    return steps
      .slice(0, index)
      .some((prev) => prev.isRequired !== false && prev.status !== "complete");
  };

  return (
    <div className={"flex flex-col gap-6 " + (className ?? "")}>
      <DisclosureGroup
        // The RAC Key type differs from React's Key type — cast through unknown to satisfy TS.
        {...({
          expandedKeys: expandedIds,
          onExpandedChange: (keys: Iterable<string | number>) =>
            setExpandedIds(new Set([...keys].map(String))),
        } as unknown as Record<string, unknown>)}
      >
        {steps.map((step, index) => {
          const status = step.status ?? "not-started";
          const isBlocked = stepIsBlocked(index);
          const isExpanded = expandedIds.has(step.id);

          return (
            <div key={step.id}>
              {index > 0 ? <Separator className="my-2" /> : null}
              <Disclosure id={step.id} isDisabled={isBlocked}>
                <Disclosure.Heading>
                  <Button
                    className={
                      "w-full justify-between border-none " + (isExpanded ? "" : "bg-transparent")
                    }
                    slot="trigger"
                    variant={isExpanded ? "secondary" : "tertiary"}
                  >
                    <span className="flex items-center gap-3">
                      <Iconify
                        className={
                          "size-4 " +
                          (status === "complete"
                            ? "text-success"
                            : status === "in-progress"
                              ? "text-warning"
                              : status === "error"
                                ? "text-danger"
                                : "text-muted")
                        }
                        icon={STATUS_ICON[status]}
                      />
                      <span className="font-medium text-foreground">
                        {index + 1}. {step.label}
                      </span>
                      <Chip color={STATUS_COLOR[status]} size="sm" variant="soft">
                        <Chip.Label>
                          {status === "not-started"
                            ? `${index + 1} of ${steps.length}`
                            : status.replace("-", " ")}
                        </Chip.Label>
                      </Chip>
                    </span>
                    <Disclosure.Indicator className="text-muted" />
                  </Button>
                </Disclosure.Heading>
                <Disclosure.Content>
                  <Disclosure.Body className="p-4">{step.content}</Disclosure.Body>
                </Disclosure.Content>
              </Disclosure>
            </div>
          );
        })}
      </DisclosureGroup>

      <div className="flex flex-wrap items-center justify-end gap-2">
        {onCancel ? (
          <Button onPress={onCancel} type="button" variant="ghost">
            Cancel
          </Button>
        ) : null}
        <Button
          isDisabled={!allRequiredComplete || isSubmitting}
          onPress={onSubmit}
          type="button"
          variant="primary"
        >
          <Iconify className="size-4" icon="check" />
          {submitLabel}
        </Button>
      </div>
    </div>
  );
}
