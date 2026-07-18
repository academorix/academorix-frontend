/**
 * invoice-reminders.json — auto-scaffolded from the mock fixture shape.
 *
 * Every field mirrors an observed field in invoice-reminders.json. Nullability and
 * optionality reflect the actual JSON (a field is nullable if it ever
 * appears as null; optional if it is missing from at least one record).
 * ID fields are branded — see ../ids.ts. Closed enums live in ../enums.ts.
 */
import { z } from "zod";

import { Timestamp } from "../common.js";
import { NotificationChannel } from "../enums.js";
import { InvoiceId, TenantId } from "../ids.js";

import { collectionHelpers } from "./_helpers.js";

export const InvoiceReminder = z
  .object({
    id: z.string(),
    tenant_id: TenantId,
    invoice_id: InvoiceId,
    step: z.number(),
    channel: NotificationChannel,
    scheduled_at: Timestamp,
    sent_at: Timestamp.nullable(),
    status: z.enum(["scheduled", "sent"]),
    created_at: Timestamp,
    updated_at: Timestamp,
  })
  .loose();
export type InvoiceReminder = z.infer<typeof InvoiceReminder>;

export const { array: InvoiceReminderList, parse: parseInvoiceRemindersJson } =
  collectionHelpers(InvoiceReminder);
