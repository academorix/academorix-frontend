/**
 * public-site.json — auto-scaffolded from the mock fixture shape.
 *
 * Every field mirrors an observed field in public-site.json. Nullability and
 * optionality reflect the actual JSON (a field is nullable if it ever
 * appears as null; optional if it is missing from at least one record).
 * ID fields are branded — see ../ids.ts. Closed enums live in ../enums.ts.
 */
import { z } from "zod";

import { Timestamp } from "../common.js";
import { PublicPageId, TenantId } from "../ids.js";

import { collectionHelpers } from "./_helpers.js";

export const PublicSite = z
  .object({
    id: PublicPageId,
    tenant_id: TenantId,
    slug: z.enum(["about", "contact", "home", "programs", "summer-camp-2026"]),
    title: z.string(),
    status: z.enum(["draft", "published", "scheduled"]),
    template: z.enum(["about", "contact", "landing", "programs"]),
    is_home: z.boolean(),
    updated_by: z.string(),
    created_at: Timestamp,
    updated_at: Timestamp,
  })
  .loose();
export type PublicSite = z.infer<typeof PublicSite>;

export const { array: PublicSiteList, parse: parsePublicSiteJson } = collectionHelpers(PublicSite);
