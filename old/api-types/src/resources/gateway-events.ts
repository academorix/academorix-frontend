/**
 * gateway-events.json — auto-scaffolded from the mock fixture shape.
 *
 * Every field mirrors an observed field in gateway-events.json. Nullability and
 * optionality reflect the actual JSON (a field is nullable if it ever
 * appears as null; optional if it is missing from at least one record).
 * ID fields are branded — see ../ids.ts. Closed enums live in ../enums.ts.
 */
import { z } from "zod";

import { Timestamp } from "../common.js";
import { EventId, GatewayEventId, TenantId } from "../ids.js";

import { collectionHelpers } from "./_helpers.js";

export const GatewayEvent = z
  .object({
    id: GatewayEventId,
    tenant_id: TenantId.nullable(),
    gateway: z.enum(["stripe"]),
    event_id: EventId,
    type: z.string(),
    status: z.enum(["processed", "received"]),
    connected_account_id: z.string(),
    related_object_type: z.enum(["dispute", "payment_intent"]),
    related_object_id: z.string(),
    received_at: Timestamp,
    processed_at: Timestamp.nullable(),
    error: z.string().nullable(),
  })
  .loose();
export type GatewayEvent = z.infer<typeof GatewayEvent>;

export const { array: GatewayEventList, parse: parseGatewayEventsJson } =
  collectionHelpers(GatewayEvent);
