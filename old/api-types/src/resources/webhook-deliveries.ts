/**
 * webhook-deliveries.json — auto-scaffolded from the mock fixture shape.
 *
 * Every field mirrors an observed field in webhook-deliveries.json. Nullability and
 * optionality reflect the actual JSON (a field is nullable if it ever
 * appears as null; optional if it is missing from at least one record).
 * ID fields are branded — see ../ids.ts. Closed enums live in ../enums.ts.
 */
import { z } from "zod";

import { Timestamp } from "../common.js";
import { WebhookDeliveryStatus } from "../enums.js";
import { TenantId, WebhookDeliveryId, WebhookEndpointId } from "../ids.js";

import { collectionHelpers } from "./_helpers.js";

export const WebhookDeliverie = z
  .object({
    id: WebhookDeliveryId,
    tenant_id: TenantId,
    endpoint_id: WebhookEndpointId,
    event_type: z.enum([
      "chargeback.opened",
      "dunning.step_3",
      "event.published",
      "invoice.paid",
      "match.scheduled",
      "refund.issued",
    ]),
    event_payload_ref: z.string(),
    status: WebhookDeliveryStatus,
    attempt_count: z.number(),
    next_attempt_at: Timestamp.nullable(),
    last_response_code: z.number().nullable(),
    last_response_body_preview: z.string().nullable(),
    delivered_at: Timestamp.nullable(),
    created_at: Timestamp,
    updated_at: Timestamp,
  })
  .loose();
export type WebhookDeliverie = z.infer<typeof WebhookDeliverie>;

export const { array: WebhookDeliverieList, parse: parseWebhookDeliveriesJson } =
  collectionHelpers(WebhookDeliverie);
