/**
 * mfa-methods.json — auto-scaffolded from the mock fixture shape.
 *
 * Every field mirrors an observed field in mfa-methods.json. Nullability and
 * optionality reflect the actual JSON (a field is nullable if it ever
 * appears as null; optional if it is missing from at least one record).
 * ID fields are branded — see ../ids.ts. Closed enums live in ../enums.ts.
 */
import { z } from "zod";

import { Timestamp } from "../common.js";
import { MfaMethodStatus, MfaMethodType } from "../enums.js";
import { MfaMethodId, TenantId, UserId } from "../ids.js";

import { collectionHelpers } from "./_helpers.js";

export const MfaMethod = z
  .object({
    id: MfaMethodId,
    tenant_id: TenantId,
    user_id: UserId,
    type: MfaMethodType,
    label: z.string(),
    verified_at: Timestamp.nullable(),
    last_used_at: Timestamp.nullable(),
    created_at: Timestamp,
    is_primary: z.boolean().optional(),
    is_backup: z.boolean().optional(),
    updated_at: Timestamp.optional(),
    status: MfaMethodStatus.optional(),
    disabled_reason: z.string().optional(),
    disabled_at: Timestamp.optional(),
    revoked_reason: z.string().optional(),
    revoked_by_user_id: UserId.optional(),
    revoked_at: Timestamp.optional(),
  })
  .loose();
export type MfaMethod = z.infer<typeof MfaMethod>;

export const { array: MfaMethodList, parse: parseMfaMethodsJson } = collectionHelpers(MfaMethod);
