/**
 * integrations.json — auto-scaffolded from the mock fixture shape.
 *
 * Every field mirrors an observed field in integrations.json. Nullability and
 * optionality reflect the actual JSON (a field is nullable if it ever
 * appears as null; optional if it is missing from at least one record).
 * ID fields are branded — see ../ids.ts. Closed enums live in ../enums.ts.
 */
import { z } from "zod";

import { Timestamp } from "../common.js";
import { IntegrationStatus } from "../enums.js";
import { TenantId } from "../ids.js";

import { collectionHelpers } from "./_helpers.js";

export const Integration = z
  .object({
    id: z.string(),
    tenant_id: TenantId,
    provider: z.enum(["google_calendar", "quickbooks", "reverb", "sendgrid", "stripe", "twilio"]),
    name: z.string(),
    category: z.enum(["accounting", "calendar", "messaging", "payments", "realtime"]),
    status: IntegrationStatus,
    is_enabled: z.boolean(),
    scope: z.enum(["tenant"]),
    credentials_ref: z.string().nullable(),
    webhook_url: z
      .enum(["/api/webhooks/sendgrid", "/api/webhooks/stripe", "/api/webhooks/twilio"])
      .nullable(),
    capabilities: z.array(z.string()),
    last_synced_at: Timestamp.nullable(),
    note: z.string(),
    created_at: Timestamp,
    updated_at: Timestamp,
  })
  .loose();
export type Integration = z.infer<typeof Integration>;

export const { array: IntegrationList, parse: parseIntegrationsJson } =
  collectionHelpers(Integration);
