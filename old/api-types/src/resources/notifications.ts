/**
 * notifications.json — auto-scaffolded from the mock fixture shape.
 *
 * Every field mirrors an observed field in notifications.json. Nullability and
 * optionality reflect the actual JSON (a field is nullable if it ever
 * appears as null; optional if it is missing from at least one record).
 * ID fields are branded — see ../ids.ts. Closed enums live in ../enums.ts.
 */
import { z } from "zod";

import { Timestamp } from "../common.js";
import { NotificationChannel, NotificationStatus } from "../enums.js";
import { NotificationId, NotificationTemplateId, TenantId, UserId } from "../ids.js";

import { collectionHelpers } from "./_helpers.js";

export const Notification = z
  .object({
    id: NotificationId,
    tenant_id: TenantId,
    user_id: UserId.nullable(),
    template_id: NotificationTemplateId.nullable(),
    type: z.string(),
    channel: NotificationChannel,
    title: z.string().nullable(),
    body_preview: z.string(),
    data_ref: z.record(z.string(), z.unknown()),
    status: NotificationStatus,
    sent_at: Timestamp,
    read_at: Timestamp.nullable(),
    failure_reason: z.string().nullable(),
    created_at: Timestamp,
    updated_at: Timestamp,
    notes: z.string().optional(),
  })
  .loose();
export type Notification = z.infer<typeof Notification>;

export const { array: NotificationList, parse: parseNotificationsJson } =
  collectionHelpers(Notification);
