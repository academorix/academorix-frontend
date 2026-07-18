/**
 * @file progress-tabs.tsx
 * @module components/progress-tabs
 *
 * @description
 * The `progress-tabs` container per §7.2. Wraps HeroUI's `Tabs` with a
 * per-step status chip (`not-started` | `in-progress` | `complete` | `error`)
 * and disables the submit button until every required step is `complete`.
 *
 * Use for fixed-step forms (3–6 steps, no scroll needed per step). For
 * longer, sequential flows, prefer `<ProgressAccordion>`.
 */

import { Button, Chip, Tabs } from "@heroui/react";
import { useCallback, useMemo, useState } from "react";

import type { Key, ReactNode } from "react";

import { Iconify } from "@/icons/iconify";

export type ProgressStatus = "not-started" | "in-progress" | "complete" | "error";

export type ProgressStep = {
  id: string;
  label: string;
  labelKey?: string;
  icon?: string;
  content: ReactNode;
  status?: ProgressStatus;
  isRequired?: boolean;
};

type ProgressTabsProps = {
  steps: ProgressStep[];
  submitLabel?: string;
  isSubmitting?: boolean;
  onSubmit: () => void;
  onCancel?: () => void;
  onStepChange?: (id: string) => void;
  className?: string;
};

const STATUS_COLOR: Record<
  ProgressStatus,
  "default" | "accent" | "success" | "warning" | "danger"
> = {
  "not-started": "default",
  "in-progress": "warning",
  complete: "success",
  error: "danger",
};

const STATUS_ICON: Record<ProgressStatus, string> = {
  "not-started": "circle",
  "in-progress": "hourglass",
  complete: "circle-check-fill",
  error: "circle-xmark-fill",
};

export function ProgressTabs({
  steps,
  submitLabel = "Submit",
  isSubmitting,
  onSubmit,
  onCancel,
  onStepChange,
  className,
}: ProgressTabsProps) {
  const [active, setActive] = useState<Key>(steps[0]?.id ?? "");

  const allRequiredComplete = useMemo(
    () => steps.filter((s) => s.isRequired !== false).every((s) => s.status === "complete"),
    [steps],
  );

  const handleSelectionChange = useCallback(
    (key: Key) => {
      setActive(key);
      onStepChange?.(String(key));
    },
    [onStepChange],
  );

  const goPrev = () => {
    const index = steps.findIndex((step) => step.id === String(active));

    if (index > 0) handleSelectionChange(steps[index - 1]!.id);
  };

  const goNext = () => {
    const index = steps.findIndex((step) => step.id === String(active));

    if (index < steps.length - 1) handleSelectionChange(steps[index + 1]!.id);
  };

  const activeIndex = steps.findIndex((step) => step.id === String(active));
  const isFirst = activeIndex === 0;
  const isLast = activeIndex === steps.length - 1;

  return (
    <div className={"flex flex-col gap-6 " + (className ?? "")}>
      <Tabs
        onSelectionChange={handleSelectionChange}
        selectedKey={String(active)}
        variant="secondary"
      >
        <Tabs.ListContainer>
          <Tabs.List aria-label="Form steps">
            {steps.map((step, index) => {
              const status = step.status ?? "not-started";

              return (
                <Tabs.Tab key={step.id} id={step.id}>
                  {index > 0 ? <Tabs.Separator /> : null}
                  <span className="flex items-center gap-2">
                    <Iconify
                      className={
                        "size-3.5 " +
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
                    {step.label}
                    <Chip color={STATUS_COLOR[status]} size="sm" variant="soft">
                      <Chip.Label>
                        {status === "not-started" ? `Step ${index + 1}` : status.replace("-", " ")}
                      </Chip.Label>
                    </Chip>
                  </span>
                  <Tabs.Indicator />
                </Tabs.Tab>
              );
            })}
          </Tabs.List>
        </Tabs.ListContainer>

        {steps.map((step) => (
          <Tabs.Panel key={step.id} className="pt-6" id={step.id}>
            {step.content}
          </Tabs.Panel>
        ))}
      </Tabs>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          {onCancel ? (
            <Button onPress={onCancel} type="button" variant="ghost">
              Cancel
            </Button>
          ) : null}
        </div>
        <div className="flex items-center gap-2">
          <Button isDisabled={isFirst} onPress={goPrev} type="button" variant="secondary">
            <Iconify className="size-4" icon="arrow-left" />
            Back
          </Button>
          {isLast ? (
            <Button
              isDisabled={!allRequiredComplete || isSubmitting}
              onPress={onSubmit}
              type="button"
              variant="primary"
            >
              <Iconify className="size-4" icon="check" />
              {submitLabel}
            </Button>
          ) : (
            <Button onPress={goNext} type="button" variant="primary">
              Next
              <Iconify className="size-4" icon="arrow-right" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
