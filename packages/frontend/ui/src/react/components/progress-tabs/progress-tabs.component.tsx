/**
 * @file progress-tabs.component.tsx
 * @module @stackra/ui/react/components/progress-tabs
 * @description Multi-step progress tabs compound built on HeroUI's
 *   `Tabs` primitive (React Aria under the hood). Preserves the
 *   `<ProgressTabs>` / `.List` / `.Trigger` / `.Content` compound
 *   API while inheriting the tab pattern's a11y guarantees: `role=tab`
 *   on triggers, `role=tabpanel` on panels, `aria-controls` /
 *   `aria-labelledby` linkage, and ArrowLeft/ArrowRight/Home/End
 *   focus management courtesy of React Aria.
 *
 *   Consumers keep the same import + usage — the only visible shift
 *   is that the underlying tab bar renders the standard HeroUI Tabs
 *   look (indicator + separators) instead of the previous
 *   `Stepper`-flavoured bar. Round 6 UI reviewer flagged the old
 *   implementation as a broken tab widget (dangling `aria-labelledby`,
 *   no arrow-key nav) — this rebuild fixes both.
 *
 *   See `.kiro/reports/ui-design-a11y-reviewer-2026-07-21.md`
 *   §"P1 findings > progress-tabs".
 */

"use client";

import { Tabs } from "@heroui/react";
import React, { useCallback, useMemo, useState, type Key, type ReactElement } from "react";

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
 * with progress status indicators. Renders HeroUI `Tabs` at its
 * core so the trigger/panel pair inherits full WAI-ARIA "Tabs"
 * keyboard support out of the box.
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
}: ProgressTabsProps): ReactElement {
  // Track the active key locally when uncontrolled so the exposed
  // context stays reactive to selection changes; when controlled we
  // read from `selectedKey` directly and never write to internalKey.
  const [internalKey, setInternalKey] = useState<string>(defaultSelectedKey ?? "");
  const activeKey = selectedKey ?? internalKey;

  // The steps registry lets Trigger children opt in via their
  // `value` — we keep the shape from the pre-Tabs implementation
  // so downstream consumers of `useProgressTabs()` see the same
  // contract.
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

  // React Aria's Tabs emits a `Key` (string | number) on selection
  // change; normalise to string so consumers can rely on stable
  // key shape.
  const handleTabsSelectionChange = useCallback(
    (key: Key) => {
      setActiveKey(String(key));
    },
    [setActiveKey],
  );

  const contextValue = useMemo(
    () => ({ activeKey, setActiveKey, steps, registerStep }),
    [activeKey, setActiveKey, steps, registerStep],
  );

  return (
    <ProgressTabsContext.Provider value={contextValue}>
      {/*
        Wrapping div carries `data-component="progress-tabs"` +
        the caller's className so external CSS selectors and
        forwarded classes still work. HeroUI's `Tabs` sits inside
        and owns the a11y wiring (role=tablist, roving tabindex,
        aria-controls / aria-labelledby).
      */}
      <div className={className} data-component="progress-tabs">
        <Tabs
          {...(activeKey ? { selectedKey: activeKey } : {})}
          onSelectionChange={handleTabsSelectionChange}
        >
          {children}
        </Tabs>
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
 *
 * Wraps HeroUI `Tabs.List` inside `Tabs.ListContainer` — the
 * container adds overflow scroll shadows for long lists at no
 * cost to shorter ones. The `aria-label` cascades onto the
 * `role=tablist` element so screen readers announce the group's
 * purpose.
 */
function ProgressTabsList({
  "aria-label": ariaLabel,
  className,
  children,
}: ProgressTabsListProps): ReactElement {
  return (
    <Tabs.ListContainer>
      <Tabs.List aria-label={ariaLabel} className={className}>
        {children}
      </Tabs.List>
    </Tabs.ListContainer>
  );
}

ProgressTabsList.displayName = "ProgressTabs.List";

// ============================================================================
// Trigger
// ============================================================================

/**
 * ProgressTabs.Trigger — Individual step tab.
 *
 * Renders a HeroUI `Tabs.Tab` with the tab's key mapped from the
 * component's `value` prop. Registers the step with the parent
 * context so `useProgressTabs()` can enumerate every trigger.
 * `Tabs.Indicator` renders the moving selection indicator that
 * highlights the currently selected tab.
 *
 * `status` is accepted for API stability with the previous
 * Stepper-based implementation, and is exposed on the DOM as a
 * `data-status` attribute so consumers can style completed /
 * in-progress states via CSS if needed.
 */
const ProgressTabsTrigger = React.memo(function ProgressTabsTrigger({
  value,
  status,
  isDisabled,
  className,
  children,
}: ProgressTabsTriggerProps): ReactElement {
  const { registerStep } = useProgressTabs();

  React.useEffect(() => {
    registerStep(value);
  }, [value, registerStep]);

  return (
    <Tabs.Tab
      id={value}
      className={className}
      isDisabled={isDisabled}
      data-status={status ?? "not-started"}
    >
      {children}
      <Tabs.Indicator />
    </Tabs.Tab>
  );
});

ProgressTabsTrigger.displayName = "ProgressTabs.Trigger";

// ============================================================================
// Content
// ============================================================================

/**
 * ProgressTabs.Content — Panel rendered when its value matches the active key.
 *
 * `Tabs.Panel` handles the visibility toggling: React Aria renders
 * the panel only when its `id` matches the parent's selected key,
 * so callers can rely on `queryByTestId(inactive)` returning null
 * (a behaviour the compound has always exposed).
 */
const ProgressTabsContent = React.memo(function ProgressTabsContent({
  value,
  className,
  children,
}: ProgressTabsContentProps): ReactElement {
  return (
    <Tabs.Panel id={value} className={className}>
      {children}
    </Tabs.Panel>
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
