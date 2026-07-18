/**
 * permissions.json — auto-scaffolded from the mock fixture shape.
 *
 * Every field mirrors an observed field in permissions.json. Nullability and
 * optionality reflect the actual JSON (a field is nullable if it ever
 * appears as null; optional if it is missing from at least one record).
 * ID fields are branded — see ../ids.ts. Closed enums live in ../enums.ts.
 */
import { z } from "zod";

import { collectionHelpers } from "./_helpers.js";

export const Permission = z
  .object({
    key: z.string(),
    description: z.string(),
    category: z.string(),
  })
  .loose();
export type Permission = z.infer<typeof Permission>;

export const { array: PermissionList, parse: parsePermissionsJson } = collectionHelpers(Permission);
