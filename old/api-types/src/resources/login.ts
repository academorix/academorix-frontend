/**
 * login.json — auto-scaffolded from the mock fixture shape.
 *
 * Every field mirrors an observed field in login.json. Nullability and
 * optionality reflect the actual JSON (a field is nullable if it ever
 * appears as null; optional if it is missing from at least one record).
 * ID fields are branded — see ../ids.ts. Closed enums live in ../enums.ts.
 */
import { z } from "zod";

export const Login = z
  .object({
    access_token: z.string(),
    token_type: z.enum(["Bearer"]),
    abilities: z.array(z.string()),
    risk_score: z.number(),
    expires_at: z.unknown().nullable(),
    recovery_codes_remaining: z.unknown().nullable(),
    two_factor_setup_required: z.boolean(),
    user: z.record(z.string(), z.unknown()),
  })
  .loose();
export type Login = z.infer<typeof Login>;

export const parseLoginJson = (raw: unknown) => Login.parse(raw);
