/**
 * @file progress-tabs.component.tsx
 * @module @stackra/ui/react/components/progress-tabs
 * @description Multi-step progress tabs compound component built on HeroUI Pro's Stepper.
 *   Provides a Medusa-style tabbed step indicator for multi-step forms.
 */

"use client";

import { Stepper } from "@heroui-pro/react";
import React, { useState, useMemo, useCallback } from "react";

// Relative imports intentionally — the `@/*` tsconfig alias works
// for tsc / tsup / vitest but the app's Vite dev server hits a
// resolve error when it walks the workspace source directly.
// Relative paths resolve identically in every tool.
import { ProgressTabsContext } from "../../contexts/progress-tabs";
import { useProgressTabs } from "../../hooks/use-progress-tabs/use-progress-tabs.hook";

import type {
  ProgressTabsProps,
  ProgressTabsListProps,
  ProgressTabsTriggerProps,
  ProgressTabsContentProps,
} from "./progress-tabs.interface";

// ============================================================================
// Root
// ============================================================================

/**
 * ProgressTabs — Multi-step progress form container.
 *
 * Compound component providing a step-by-step tabbed interface
 * with progress status indicators.
 *
 * @example
 * ```tsx
 * <ProgressTabs defaultSelectedKey="details">
 *   <ProgressTabs.List aria-label="Create product">
 *     <ProgressTabs.Trigger value="details" status="completed">Details</ProgressTabs.Trigger>
 *     <ProgressTabs.Trigger value="organize" status="in-progress">Organize</ProgressTabs.Trigger>
 *   </ProgressTabs.List>
 *   <ProgressTabs.Content value="details"><DetailsForm /></ProgressTabs.Content>
 *   <ProgressTabs.Content value="organize"><OrganizeForm /></ProgressTabs.Content>
 * </ProgressTabs>
 * ```
 */
function ProgressTabsRoot({
  selectedKey,
  defaultSelectedKey,
  onSelectionChange,
  className,
  children,
}: ProgressTabsProps): React.ReactElement {
  const [internalKey, setInternalKey] = useState(defaultSelectedKey ?? "");
  const activeKey = selectedKey ?? internalKey;
  const [steps, setSteps] = useState<string[]>([]);

  const registerStep = useCallback((key: string) => {
    setSteps((prev) => (prev.includes(key) ? prev : [...prev, key]));
  }, []);

  const setActiveKey = useCallback(
    (key: string) => {
      if (!selectedKey) setInternalKey(key);
      onSelectionChange?.(key);
    },
    [selectedKey, onSelectionChange],
  );

  const contextValue = useMemo(
    () => ({ activeKey, setActiveKey, steps, registerStep }),
    [activeKey, setActiveKey, steps, registerStep],
  );

  return (
    <ProgressTabsContext.Provider value={contextValue}>
      <div className={className} data-component="progress-tabs">
        {children}
      </div>
    </ProgressTabsContext.Provider>
  );
}

ProgressTabsRoot.displayName = "ProgressTabs";

// ============================================================================
// List
// ============================================================================

/**
 * ProgressTabs.List — Container for step triggers.
 * Renders a horizontal Stepper bar.
 */
function ProgressTabsList({
  "aria-label": ariaLabel,
  className,
  children,
}: ProgressTabsListProps): React.ReactElement {
  const { activeKey, setActiveKey, steps } = useProgressTabs();
  const currentStepIndex = steps.indexOf(activeKey);

  const handleStepChange = useCallback(
    (index: number) => {
      const key = steps[index];

      if (key) setActiveKey(key);
    },
    [steps, setActiveKey],
  );

  return (
    <div aria-label={ariaLabel} className={className} role="tablist">
      <Stepper
        currentStep={currentStepIndex >= 0 ? currentStepIndex : 0}
        onStepChange={handleStepChange}
      >
        {children}
      </Stepper>
    </div>
  );
}

ProgressTabsList.displayName = "ProgressTabs.List";

// ============================================================================
// Trigger
// ============================================================================

/**
 * ProgressTabs.Trigger — Individual step in the progress bar.
 */
const ProgressTabsTrigger = React.memo(function ProgressTabsTrigger({
  value,
  className,
  children,
}: ProgressTabsTriggerProps): React.ReactElement {
  const { registerStep } = useProgressTabs();

  React.useEffect(() => {
    registerStep(value);
  }, [value, registerStep]);

  return (
    <Stepper.Step className={className}>
      <Stepper.Indicator />
      <Stepper.Content>
        <Stepper.Title>{children}</Stepper.Title>
      </Stepper.Content>
      <Stepper.Separator />
    </Stepper.Step>
  );
});

ProgressTabsTrigger.displayName = "ProgressTabs.Trigger";

// ============================================================================
// Content
// ============================================================================

/**
 * ProgressTabs.Content — Panel rendered when its value matches the active key.
 */
const ProgressTabsContent = React.memo(function ProgressTabsContent({
  value,
  className,
  children,
}: ProgressTabsContentProps): React.ReactElement | null {
  const { activeKey } = useProgressTabs();

  if (activeKey !== value) return null;

  return (
    <div aria-labelledby={`tab-${value}`} className={className} data-state="active" role="tabpanel">
      {children}
    </div>
  );
});

ProgressTabsContent.displayName = "ProgressTabs.Content";

// ============================================================================
// Compound Export
// ============================================================================

export const ProgressTabs = Object.assign(ProgressTabsRoot, {
  List: ProgressTabsList,
  Trigger: ProgressTabsTrigger,
  Content: ProgressTabsContent,
});
