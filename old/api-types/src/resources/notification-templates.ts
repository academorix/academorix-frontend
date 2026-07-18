/**
 * notification-templates.json — auto-scaffolded from the mock fixture shape.
 *
 * Every field mirrors an observed field in notification-templates.json. Nullability and
 * optionality reflect the actual JSON (a field is nullable if it ever
 * appears as null; optional if it is missing from at least one record).
 * ID fields are branded — see ../ids.ts. Closed enums live in ../enums.ts.
 */
import { z } from "zod";

import { Timestamp } from "../common.js";
import { NotificationChannel, NotificationTemplateStatus } from "../enums.js";
import { NotificationTemplateId, TenantId } from "../ids.js";

import { collectionHelpers } from "./_helpers.js";

export const NotificationTemplate = z
  .object({
    id: NotificationTemplateId,
    tenant_id: TenantId,
    key: z.enum([
      "clearance_expiring",
      "event_invitation",
      "lineup_published",
      "payment_due",
      "welcome",
    ]),
    channel: NotificationChannel,
    locale: z.enum(["ar", "en"]),
    subject: z.string().nullable(),
    body: z.string(),
    variables: z.array(z.string()),
    status: NotificationTemplateStatus,
    created_at: Timestamp,
    updated_at: Timestamp,
  })
  .loose();
export type NotificationTemplate = z.infer<typeof NotificationTemplate>;

export const { array: NotificationTemplateList, parse: parseNotificationTemplatesJson } =
  collectionHelpers(NotificationTemplate);
