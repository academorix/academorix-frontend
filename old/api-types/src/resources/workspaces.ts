/**
 * workspaces.json — auto-scaffolded from the mock fixture shape.
 *
 * Every field mirrors an observed field in workspaces.json. Nullability and
 * optionality reflect the actual JSON (a field is nullable if it ever
 * appears as null; optional if it is missing from at least one record).
 * ID fields are branded — see ../ids.ts. Closed enums live in ../enums.ts.
 */
import { z } from "zod";

import { Timestamp } from "../common.js";
import { BusinessType } from "../enums.js";
import { TenantId } from "../ids.js";

import { collectionHelpers } from "./_helpers.js";

export const Workspace = z
  .object({
    id: TenantId,
    slug: z.enum(["bay-academy", "demo", "harbor", "riverside", "seaside"]),
    name: z.string(),
    business_type: BusinessType,
    logo_url: z.unknown().nullable(),
    role: z.string(),
    last_active_at: Timestamp,
    is_staff_only_workspace: z.boolean().optional(),
    notes: z.string().optional(),
  })
  .loose();
export type Workspace = z.infer<typeof Workspace>;

export const { array: WorkspaceList, parse: parseWorkspacesJson } = collectionHelpers(Workspace);
