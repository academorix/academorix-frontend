/**
 * @file status-badge.component.tsx
 * @module @stackra/ui/react/components/status-badge
 * @description Colored dot + status text badge for entity status display.
 *   Maps status semantics to consistent colors across all admin tables.
 *
 *   v3 compliance:
 *   - Uses the HeroUI v3 `Chip` `color` prop. Valid values are
 *     `default | accent | success | warning | danger` — there is no `'primary'`
 *     in v3 (the v2 `accent: 'primary'` mapping is replaced with
 *     `accent: 'accent'`).
 *   - `variant="soft"` and the compound `Chip.Label` slot remain valid in v3.
 */

"use client";

import { Chip } from "@heroui/react";
import React from "react";

import type { StatusBadgeProps, StatusBadgeColor } from "./status-badge.interface";

/** Map semantic color to HeroUI v3 Chip color prop. */
const colorMap: Record<StatusBadgeColor, "success" | "warning" | "danger" | "default" | "accent"> =
  {
    success: "success",
    warning: "warning",
    danger: "danger",
    default: "default",
    accent: "accent",
  };

/**
 * StatusBadge — Dot indicator + text label badge.
 *
 * A standardized badge component that displays entity status with
 * a colored dot and text label. Uses HeroUI v3 `Chip` with the
 * `soft` variant and the v3 `accent` color token (the v2 `primary`
 * value is not valid in v3).
 *
 * @param props - Component props.
 * @returns The status badge element.
 *
 * @example
 * ```tsx
 * <StatusBadge label="Active" color="success" />
 * <StatusBadge label="Draft" color="default" />
 * <StatusBadge label="Expired" color="danger" />
 * ```
 */
export const StatusBadge = React.memo(function StatusBadge({
  label,
  color = "default",
  className,
}: StatusBadgeProps): React.ReactElement {
  return (
    <Chip
      className={className}
      color={colorMap[color]}
      data-component="status-badge"
      size="sm"
      variant="soft"
    >
      <span aria-hidden="true" className="mr-1.5 inline-block size-1.5 rounded-full bg-current" />
      <Chip.Label>{label}</Chip.Label>
    </Chip>
  );
});

StatusBadge.displayName = "StatusBadge";
