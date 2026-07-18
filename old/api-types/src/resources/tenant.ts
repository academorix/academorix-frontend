/**
 * tenant.json — current-tenant summary object returned by `/tenant`.
 *
 * The endpoint returns an object wrapped in `{ data: {...} }` — the shape
 * matches Laravel's default envelope. The nested object is a superset of the
 * tenant record with a few display-friendly labels.
 */

import { z } from "zod";

import { Timestamp } from "../common.js";
import { BusinessType, TenantStatus } from "../enums.js";
import { BusinessTypeId, TenantId } from "../ids.js";

export const CurrentTenantData = z
  .object({
    id: TenantId,
    slug: z.string().optional(),
    name: z.string(),
    business_type: BusinessType.optional(),
    business_type_id: BusinessTypeId.optional(),
    business_type_label: z.string().optional(),
    status: TenantStatus,
    status_label: z.string().optional(),
    reporting_currency: z.string().length(3).optional(),
    default_locale: z.string().optional(),
    default_timezone: z.string().optional(),
    branding: z.record(z.string(), z.unknown()).optional(),
    created_at: Timestamp,
    updated_at: Timestamp,
  })
  .loose();
export type CurrentTenantData = z.infer<typeof CurrentTenantData>;

export const CurrentTenant = z.object({ data: CurrentTenantData });
export type CurrentTenant = z.infer<typeof CurrentTenant>;

export const parseTenantJson = (raw: unknown) => CurrentTenant.parse(raw);
