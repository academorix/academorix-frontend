/**
 * webhook-endpoints.json — auto-scaffolded from the mock fixture shape.
 *
 * Every field mirrors an observed field in webhook-endpoints.json. Nullability and
 * optionality reflect the actual JSON (a field is nullable if it ever
 * appears as null; optional if it is missing from at least one record).
 * ID fields are branded — see ../ids.ts. Closed enums live in ../enums.ts.
 */
import { z } from "zod";

import { Timestamp } from "../common.js";
import { WebhookEndpointStatus } from "../enums.js";
import { TenantId, WebhookEndpointId } from "../ids.js";

import { collectionHelpers } from "./_helpers.js";

export const WebhookEndpoint = z
  .object({
    id: WebhookEndpointId,
    tenant_id: TenantId,
    name: z.string(),
    url: z.string(),
    secret_masked: z.string(),
    events: z.array(z.string()),
    status: WebhookEndpointStatus,
    last_delivery_at: Timestamp,
    failure_count: z.number(),
    created_at: Timestamp,
    updated_at: Timestamp,
  })
  .loose();
export type WebhookEndpoint = z.infer<typeof WebhookEndpoint>;

export const { array: WebhookEndpointList, parse: parseWebhookEndpointsJson } =
  collectionHelpers(WebhookEndpoint);
