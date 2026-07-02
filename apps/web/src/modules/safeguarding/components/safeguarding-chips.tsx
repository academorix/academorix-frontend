/**
 * @file safeguarding-chips.tsx
 * @module modules/safeguarding/components/safeguarding-chips
 *
 * @description
 * Color-coded HeroUI `Chip`s for a safeguarding case's severity and lifecycle
 * status, so styling stays consistent across the list and detail screens.
 */

import { Chip } from "@academorix/ui/react";

import type {
  SafeguardingSeverity,
  SafeguardingStatus,
} from "@/modules/safeguarding/safeguarding.types";
import type { ReactNode } from "react";

import {
  SAFEGUARDING_SEVERITY_LABELS,
  SAFEGUARDING_STATUS_LABELS,
} from "@/modules/safeguarding/safeguarding.types";

/** Severity → semantic Chip color (higher severity trends toward danger). */
const SEVERITY_COLOR: Record<SafeguardingSeverity, "success" | "warning" | "danger" | "default"> = {
  low: "default",
  medium: "warning",
  high: "danger",
  critical: "danger",
};

/** Status → semantic Chip color. */
const STATUS_COLOR: Record<SafeguardingStatus, "success" | "warning" | "danger" | "default"> = {
  open: "warning",
  monitoring: "default",
  escalated: "danger",
  closed: "success",
};

/** A soft chip for a case's severity. Critical uses a solid variant for emphasis. */
export function SafeguardingSeverityChip({
  severity,
}: {
  severity: SafeguardingSeverity;
}): ReactNode {
  return (
    <Chip
      color={SEVERITY_COLOR[severity]}
      size="sm"
      variant={severity === "critical" ? "primary" : "soft"}
    >
      {SAFEGUARDING_SEVERITY_LABELS[severity]}
    </Chip>
  );
}

/** A soft chip for a case's lifecycle status. */
export function SafeguardingStatusChip({ status }: { status: SafeguardingStatus }): ReactNode {
  return (
    <Chip color={STATUS_COLOR[status]} size="sm" variant="soft">
      {SAFEGUARDING_STATUS_LABELS[status]}
    </Chip>
  );
}
