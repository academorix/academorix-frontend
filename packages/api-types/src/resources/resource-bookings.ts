/**
 * resource-bookings.json — auto-scaffolded from the mock fixture shape.
 *
 * Every field mirrors an observed field in resource-bookings.json. Nullability and
 * optionality reflect the actual JSON (a field is nullable if it ever
 * appears as null; optional if it is missing from at least one record).
 * ID fields are branded — see ../ids.ts. Closed enums live in ../enums.ts.
 */
import { z } from "zod";

import { Timestamp } from "../common.js";
import { ActivityType, ResourceBookingStatus } from "../enums.js";
import { ApprovalTaskId, BranchId, FacilityId, StaffId, TenantId } from "../ids.js";

import { collectionHelpers } from "./_helpers.js";

export const ResourceBooking = z
  .object({
    id: z.string(),
    tenant_id: TenantId,
    resource_id: FacilityId,
    activity_type: ActivityType,
    activity_id: z.string(),
    start_at: Timestamp,
    end_at: Timestamp,
    status: ResourceBookingStatus,
    booked_by: z.string(),
    notes: z.string(),
    created_at: Timestamp,
    updated_at: Timestamp,
    coach_id: StaffId.optional(),
    branch_id: BranchId.optional(),
    blocked_reason: z.string().optional(),
    conflicting_booking_id: z.string().optional(),
    escalation_task_id: ApprovalTaskId.optional(),
  })
  .loose();
export type ResourceBooking = z.infer<typeof ResourceBooking>;

export const { array: ResourceBookingList, parse: parseResourceBookingsJson } =
  collectionHelpers(ResourceBooking);
