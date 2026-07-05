/**
 * tenants.json — every tenant that can be switched to via the workspace picker.
 */

import { z } from "zod";

import { Address, Locale, Metadata, Timestamp } from "../common.js";
import { BusinessType, TenantStatus } from "../enums.js";
import { BusinessTypeId, RegionId, TenantId } from "../ids.js";

import { collectionHelpers } from "./_helpers.js";

export const Tenant = z
  .object({
    id: TenantId,
    slug: z.string().optional(),
    name: z.string(),
    display_name: z.string().optional(),
    business_type: BusinessType.optional(),
    business_type_id: BusinessTypeId.optional(),
    region_id: RegionId.nullable().optional(),
    default_locale: Locale.optional(),
    default_currency: z.string().length(3).optional(),
    default_timezone: z.string().optional(),
    status: TenantStatus,
    branding: z.record(z.string(), z.unknown()).optional(),
    address: Address.optional(),
    contact_email: z.string().optional(),
    contact_phone: z.string().optional(),
    domains: z.array(z.record(z.string(), z.unknown())).optional(),
    is_external: z.boolean().optional(),
    metadata: Metadata.optional(),
    notes: z.string().optional(),
    created_at: Timestamp,
    updated_at: Timestamp,
  })
  .loose();
export type Tenant = z.infer<typeof Tenant>;

export const { array: TenantList, parse: parseTenantsJson } = collectionHelpers(Tenant);
