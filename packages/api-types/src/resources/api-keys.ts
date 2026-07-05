/**
 * api-keys.json — auto-scaffolded from the mock fixture shape.
 *
 * Every field mirrors an observed field in api-keys.json. Nullability and
 * optionality reflect the actual JSON (a field is nullable if it ever
 * appears as null; optional if it is missing from at least one record).
 * ID fields are branded — see ../ids.ts. Closed enums live in ../enums.ts.
 */
import { z } from "zod";

import { Timestamp } from "../common.js";
import { ApiKeyStatus } from "../enums.js";
import { ApiKeyId, OrganizationId, TenantId, UserId } from "../ids.js";

import { collectionHelpers } from "./_helpers.js";

export const ApiKey = z
  .object({
    id: z.string(),
    tenant_id: TenantId,
    organization_id: OrganizationId,
    name: z.string(),
    prefix: z.string(),
    scopes: z.array(z.string()),
    status: ApiKeyStatus,
    last_used_at: Timestamp,
    expires_at: Timestamp.nullable(),
    created_by: z.string(),
    created_at: Timestamp,
    updated_at: Timestamp,
    key_masked: z.string().optional(),
    access_level: z.enum(["read", "read_write"]).optional(),
    revoked_at: Timestamp.nullable().optional(),
    created_by_user_id: UserId.optional(),
    revoked_reason: z.enum(["rotated"]).optional(),
    rotated_to_key_id: ApiKeyId.optional(),
    usage_count_30d: z.number().optional(),
    revoked_by_user_id: UserId.optional(),
    suspended_reason: z.string().optional(),
    suspended_at: Timestamp.optional(),
    suspended_by_user_id: UserId.optional(),
  })
  .loose();
export type ApiKey = z.infer<typeof ApiKey>;

export const { array: ApiKeyList, parse: parseApiKeysJson } = collectionHelpers(ApiKey);
