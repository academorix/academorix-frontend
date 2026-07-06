/**
 * announcements.json — auto-scaffolded from the mock fixture shape.
 *
 * Every field mirrors an observed field in announcements.json. Nullability and
 * optionality reflect the actual JSON (a field is nullable if it ever
 * appears as null; optional if it is missing from at least one record).
 * ID fields are branded — see ../ids.ts. Closed enums live in ../enums.ts.
 */
import { z } from "zod";

import { Timestamp } from "../common.js";
import { AnnouncementStatus } from "../enums.js";
import { AnnouncementId, BranchId, OrganizationId, TeamId, TenantId } from "../ids.js";

import { collectionHelpers } from "./_helpers.js";

export const Announcement = z
  .object({
    id: AnnouncementId,
    tenant_id: TenantId,
    organization_id: OrganizationId,
    branch_id: BranchId,
    team_id: TeamId.nullable(),
    author_user_id: z.string(),
    title: z.string(),
    body: z.string(),
    audience: z.record(z.string(), z.unknown()),
    channels: z.array(z.string()),
    status: AnnouncementStatus,
    locale: z.enum(["en"]),
    published_at: Timestamp.nullable(),
    scheduled_at: Timestamp.nullable(),
    expires_at: Timestamp.nullable(),
    read_count: z.number(),
    created_at: Timestamp,
    updated_at: Timestamp,
  })
  .loose();
export type Announcement = z.infer<typeof Announcement>;

export const { array: AnnouncementList, parse: parseAnnouncementsJson } =
  collectionHelpers(Announcement);
