/**
 * tenant-payment-accounts.json — auto-scaffolded from the mock fixture shape.
 *
 * Every field mirrors an observed field in tenant-payment-accounts.json. Nullability and
 * optionality reflect the actual JSON (a field is nullable if it ever
 * appears as null; optional if it is missing from at least one record).
 * ID fields are branded — see ../ids.ts. Closed enums live in ../enums.ts.
 */
import { z } from "zod";

import { Timestamp } from "../common.js";
import { TenantPaymentAccountStatus, TenantPaymentAccountType } from "../enums.js";
import { RegionId, TenantId, TenantPaymentAccountId } from "../ids.js";

import { collectionHelpers } from "./_helpers.js";

export const TenantPaymentAccount = z
  .object({
    id: TenantPaymentAccountId,
    tenant_id: TenantId,
    gateway: z.enum(["paddle", "stripe"]),
    account_type: TenantPaymentAccountType,
    connected_account_id: z.string(),
    region_id: RegionId,
    charges_enabled: z.boolean(),
    payouts_enabled: z.boolean(),
    onboarding_status: z.enum(["disabled", "enabled", "pending", "restricted"]),
    status: TenantPaymentAccountStatus,
    application_fee_bps: z.number(),
    default_currency: z.enum(["USD"]),
    capabilities: z.array(z.string()),
    requirements: z.record(z.string(), z.unknown()),
    verified_at: Timestamp.nullable(),
    onboarding_completed_at: Timestamp.nullable(),
    last_status_synced_at: Timestamp,
    created_at: Timestamp,
    updated_at: Timestamp,
    notes: z.string().optional(),
    disabled_at: Timestamp.optional(),
  })
  .loose();
export type TenantPaymentAccount = z.infer<typeof TenantPaymentAccount>;

export const { array: TenantPaymentAccountList, parse: parseTenantPaymentAccountsJson } =
  collectionHelpers(TenantPaymentAccount);
