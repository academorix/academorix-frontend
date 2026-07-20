/**
 * @file progress-accordion.component.tsx
 * @module @stackra/ui/react/components/progress-accordion
 * @description Accordion with per-section progress status indicators.
 *   Each section displays a colored status dot (not-started, in-progress, completed)
 *   alongside the trigger title. Built on HeroUI v3's compound Accordion API
 *   (`Accordion`, `Accordion.Item`, `Accordion.Heading`, `Accordion.Trigger`,
 *   `Accordion.Indicator`, `Accordion.Panel`, `Accordion.Body`).
 */

"use client";

import { Accordion } from "@heroui/react";
import React, { useState, useMemo, useCallback } from "react";

import type {
  ProgressAccordionProps,
  ProgressAccordionItemProps,
  AccordionSectionStatus,
} from "./progress-accordion.interface";

// ============================================================================
// Status Indicator
// ============================================================================

/** Color mapping for each status. */
const statusStyles: Record<AccordionSectionStatus, string> = {
  "not-started": "bg-foreground/20",
  "in-progress": "bg-warning",
  completed: "bg-success",
};

/** Accessible label for each status. */
const statusLabels: Record<AccordionSectionStatus, string> = {
  "not-started": "Not started",
  "in-progress": "In progress",
  completed: "Completed",
};

/**
 * Internal status dot indicator.
 *
 * @param props - Status props.
 * @returns The status dot element.
 */
const StatusDot = React.memo(function StatusDot({
  status,
}: {
  status: AccordionSectionStatus;
}): React.ReactElement {
  return (
    <span
      aria-label={statusLabels[status]}
      className={`inline-block size-2 shrink-0 rounded-full ${statusStyles[status]}`}
      role="img"
    />
  );
});

StatusDot.displayName = "StatusDot";

// ============================================================================
// Root
// ============================================================================

/**
 * ProgressAccordion — Accordion with per-section progress indicators.
 *
 * Each section displays a status dot (not-started, in-progress, completed)
 * in the trigger header. Useful for multi-section forms where progress
 * tracking per section is needed (e.g., product creation wizard).
 *
 * Built on the HeroUI v3 compound Accordion API:
 * - The root accepts `allowsMultipleExpanded`, `expandedKeys`, and
 *   `onExpandedChange`. The `allowMultiple` public prop is translated to
 *   `allowsMultipleExpanded` internally.
 * - Each section is composed of
 *   `<Accordion.Heading><Accordion.Trigger>…</Accordion.Trigger></Accordion.Heading>`
 *   followed by `<Accordion.Panel><Accordion.Body>…</Accordion.Body></Accordion.Panel>`.
 *
 * @param props - Component props.
 * @returns The progress accordion element.
 *
 * @example
 * ```tsx
 * <ProgressAccordion defaultExpandedKeys={new Set(['general'])}>
 *   <ProgressAccordion.Item value="general" title="General" status="completed">
 *     <GeneralForm />
 *   </ProgressAccordion.Item>
 *   <ProgressAccordion.Item value="pricing" title="Pricing" status="in-progress">
 *     <PricingForm />
 *   </ProgressAccordion.Item>
 *   <ProgressAccordion.Item value="media" title="Media" status="not-started">
 *     <MediaUpload />
 *   </ProgressAccordion.Item>
 * </ProgressAccordion>
 * ```
 */
function ProgressAccordionRoot({
  expandedKeys,
  defaultExpandedKeys,
  onExpandedChange,
  allowMultiple = true,
  children,
  className,
}: ProgressAccordionProps): React.ReactElement {
  const [internalKeys, setInternalKeys] = useState<Set<string>>(defaultExpandedKeys ?? new Set());
  const activeKeys = expandedKeys ?? internalKeys;

  const handleExpandedChange = useCallback(
    (keys: Set<React.Key>) => {
      const newKeys = new Set(Array.from(keys).map(String));

      if (!expandedKeys) setInternalKeys(newKeys);
      onExpandedChange?.(newKeys);
    },
    [expandedKeys, onExpandedChange],
  );

  return (
    <Accordion
      allowsMultipleExpanded={allowMultiple}
      className={className}
      data-component="progress-accordion"
      expandedKeys={activeKeys}
      onExpandedChange={handleExpandedChange}
    >
      {children}
    </Accordion>
  );
}

ProgressAccordionRoot.displayName = "ProgressAccordion";

// ============================================================================
// Item
// ============================================================================

/**
 * ProgressAccordion.Item — Single collapsible section with status indicator.
 *
 * Renders the HeroUI v3 compound shape: `<Accordion.Item>` wraps an
 * `<Accordion.Heading>` containing the `<Accordion.Trigger>` (status dot +
 * title + optional description, with a default `<Accordion.Indicator />`
 * chevron on the trailing edge), followed by `<Accordion.Panel>` with the
 * `<Accordion.Body>` payload.
 */
const ProgressAccordionItem = React.memo(function ProgressAccordionItem({
  value,
  title,
  description,
  status = "not-started",
  isDisabled = false,
  children,
  className,
}: ProgressAccordionItemProps): React.ReactElement {
  const triggerContent = useMemo(
    () => (
      <div className="flex items-center gap-3">
        <StatusDot status={status} />
        <div className="flex flex-col gap-0.5">
          <span className="text-foreground text-sm font-medium">{title}</span>
          {description && <span className="text-foreground-500 text-xs">{description}</span>}
        </div>
      </div>
    ),
    [title, description, status],
  );

  return (
    <Accordion.Item className={className} id={value} isDisabled={isDisabled}>
      <Accordion.Heading>
        <Accordion.Trigger>
          {triggerContent}
          <Accordion.Indicator />
        </Accordion.Trigger>
      </Accordion.Heading>
      <Accordion.Panel>
        <Accordion.Body className="pt-2 pb-4">{children}</Accordion.Body>
      </Accordion.Panel>
    </Accordion.Item>
  );
});

ProgressAccordionItem.displayName = "ProgressAccordion.Item";

// ============================================================================
// Compound Export
// ============================================================================

export const ProgressAccordion = Object.assign(ProgressAccordionRoot, {
  Item: ProgressAccordionItem,
});
