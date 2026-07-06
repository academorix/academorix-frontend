/**
 * me.json — auto-scaffolded from the mock fixture shape.
 *
 * Every field mirrors an observed field in me.json. Nullability and
 * optionality reflect the actual JSON (a field is nullable if it ever
 * appears as null; optional if it is missing from at least one record).
 * ID fields are branded — see ../ids.ts. Closed enums live in ../enums.ts.
 */
import { z } from "zod";

import { collectionHelpers as _collectionHelpers } from "./_helpers.js";

export const MeData = z.record(z.string(), z.unknown());
export type MeData = z.infer<typeof MeData>;

export const Me = z.object({ data: MeData });
export type Me = z.infer<typeof Me>;

export const parseMeJson = (raw: unknown) => Me.parse(raw);

// silence linter
void _collectionHelpers;
