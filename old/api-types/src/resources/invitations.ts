/**
 * invitations.json — auto-scaffolded from the mock fixture shape.
 *
 * Every field mirrors an observed field in invitations.json. Nullability and
 * optionality reflect the actual JSON (a field is nullable if it ever
 * appears as null; optional if it is missing from at least one record).
 * ID fields are branded — see ../ids.ts. Closed enums live in ../enums.ts.
 */
import { z } from "zod";

import { Timestamp } from "../common.js";
import { InvitationStatus, ScopeType } from "../enums.js";
import { RoleId, TenantId } from "../ids.js";

import { collectionHelpers } from "./_helpers.js";

export const Invitation = z
  .object({
    id: z.string(),
    tenant_id: TenantId,
    email: z.string(),
    role_id: RoleId,
    role_name: z.enum(["coach", "finance", "parent_guardian", "reception"]),
    scope_type: ScopeType,
    scope_id: z.string(),
    status: InvitationStatus,
    invited_by: z.string(),
    message: z.string().nullable(),
    expires_at: Timestamp,
    accepted_at: Timestamp.nullable(),
    created_at: Timestamp,
    updated_at: Timestamp,
  })
  .loose();
export type Invitation = z.infer<typeof Invitation>;

export const { array: InvitationList, parse: parseInvitationsJson } = collectionHelpers(Invitation);
