/**
 * passes.json — auto-scaffolded from the mock fixture shape.
 *
 * Every field mirrors an observed field in passes.json. Nullability and
 * optionality reflect the actual JSON (a field is nullable if it ever
 * appears as null; optional if it is missing from at least one record).
 * ID fields are branded — see ../ids.ts. Closed enums live in ../enums.ts.
 */
import { z } from "zod";

import { Timestamp } from "../common.js";
import { HolderType, PassStatus } from "../enums.js";
import { BranchId, MembershipId, OrganizationId, TenantId, WalletPassId } from "../ids.js";

import { collectionHelpers } from "./_helpers.js";

export const Passe = z
  .object({
    id: WalletPassId,
    tenant_id: TenantId,
    organization_id: OrganizationId,
    branch_id: BranchId,
    holder_type: HolderType,
    holder_id: z.string(),
    provider: z.string(),
    serial: z.enum([
      "AMX-DANA-9F22-2027",
      "AMX-EMMA-8F3K-2026",
      "AMX-EMMA-8F3K-2027",
      "AMX-EMMA-8F3K-2028",
      "AMX-LIAM-TR14-2025",
      "AMX-NOAH-QP71-2027",
    ]),
    membership_id: MembershipId.nullable(),
    status: PassStatus,
    issued_at: Timestamp,
    revoked_at: Timestamp.nullable(),
    revoked_reason: z.string().nullable(),
    last_updated_at: Timestamp,
    created_at: Timestamp,
    updated_at: Timestamp,
    replaced_by_pass_id: WalletPassId.optional(),
    superseded_pass_id: WalletPassId.optional(),
    renewed_from_membership_period: z.enum(["2026-06"]).optional(),
    updated_from_membership_period: z.enum(["2026-07"]).optional(),
    pushed_to_device_at: Timestamp.optional(),
    notes: z.string().optional(),
  })
  .loose();
export type Passe = z.infer<typeof Passe>;

export const { array: PasseList, parse: parsePassesJson } = collectionHelpers(Passe);
