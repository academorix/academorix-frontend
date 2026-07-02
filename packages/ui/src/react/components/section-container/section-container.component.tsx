/**
 * @file section-container.component.tsx
 * @module @stackra/ui/react/components/section-container
 * @description Standardized card section with title, description, and action slot.
 *   Used across admin detail pages to group related form fields or information.
 */

"use client";

import { Card, Separator } from "@heroui/react";
import React from "react";

import type { SectionContainerProps } from "./section-container.interface";

/**
 * SectionContainer — Card-based section with title, description, and action.
 *
 * The standard layout unit for admin detail pages. Groups related content
 * (form fields, metadata, lists) under a labeled card with an optional
 * top-right action button.
 *
 * @param props - Component props.
 * @returns The section container element.
 *
 * @example
 * ```tsx
 * <SectionContainer
 *   title="General"
 *   description="Basic product information."
 *   action={<Button size="sm" variant="ghost">Edit</Button>}
 * >
 *   <TextField label="Title" />
 *   <TextArea label="Description" />
 * </SectionContainer>
 * ```
 */
export const SectionContainer = React.memo(function SectionContainer({
  title,
  description,
  action,
  children,
  className,
  showDivider = true,
}: SectionContainerProps): React.ReactElement {
  return (
    <Card className={`p-0 shadow-sm ${className ?? ""}`.trim()} data-component="section-container">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 px-6 pt-6 pb-4">
        <div className="flex flex-col gap-1">
          <h3 className="text-base font-semibold text-foreground">{title}</h3>
          {description && <p className="text-foreground-500 text-sm">{description}</p>}
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>

      {/* Divider */}
      {showDivider && <Separator />}

      {/* Content */}
      <div className="px-6 py-6">{children}</div>
    </Card>
  );
});

SectionContainer.displayName = "SectionContainer";
