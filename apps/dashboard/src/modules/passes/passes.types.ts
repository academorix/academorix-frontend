/**
 * @file passes.types.ts
 * @module modules/passes/passes.types
 *
 * @description
 * Module-local shapes for **digital passes** — membership/event/day passes used
 * for check-in (the `code` is the QR/scan payload). Kept local as a check-in
 * projection over memberships/registrations.
 *
 * @see DOMAIN_MODULES_BLUEPRINT.md §16.7 "Digital Passes & Check-in"
 */

import type { BaseModel, TenantScoped } from "@/types";

/** The kind of access a pass grants. */
export const PASS_TYPES = ["membership", "event", "day_pass", "trial"] as const;

/** A single pass type (e.g. `"membership"`). */
export type PassType = (typeof PASS_TYPES)[number];

/** Human-readable labels for {@link PassType}. */
export const PASS_TYPE_LABELS: Record<PassType, string> = {
  membership: "Membership",
  event: "Event",
  day_pass: "Day Pass",
  trial: "Trial",
};

/** The lifecycle of a pass. */
export const PASS_STATUSES = ["active", "expired", "revoked"] as const;

/** A single pass status (e.g. `"active"`). */
export type PassStatus = (typeof PASS_STATUSES)[number];

/** Human-readable labels for {@link PassStatus}. */
export const PASS_STATUS_LABELS: Record<PassStatus, string> = {
  active: "Active",
  expired: "Expired",
  revoked: "Revoked",
};

/**
 * A **digital pass** issued to a holder for check-in. The `code` is the scan
 * payload rendered as a QR in production.
 */
export interface Pass extends BaseModel, TenantScoped {
  organization_id: string;
  branch_id: string;
  /** Holding athlete, if the pass is athlete-bound; else `null`. */
  athlete_id: string | null;
  /** Denormalized holder display name. */
  holder_name: string;
  type: PassType;
  /** Scan/QR payload (opaque token). */
  code: string;
  status: PassStatus;
  /** ISO-8601 validity start. */
  valid_from: string;
  /** ISO-8601 validity end, or `null` for open-ended. */
  valid_until: string | null;
}
