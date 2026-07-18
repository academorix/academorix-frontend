/**
 * notification-preferences.json — auto-scaffolded from the mock fixture shape.
 *
 * Every field mirrors an observed field in notification-preferences.json. Nullability and
 * optionality reflect the actual JSON (a field is nullable if it ever
 * appears as null; optional if it is missing from at least one record).
 * ID fields are branded — see ../ids.ts. Closed enums live in ../enums.ts.
 */
import { z } from "zod";

import { Timestamp } from "../common.js";
import { TenantId, UserId } from "../ids.js";

import { collectionHelpers } from "./_helpers.js";

export const NotificationPreference = z
  .object({
    id: z.string(),
    tenant_id: TenantId,
    user_id: UserId,
    defaults: z.record(z.string(), z.unknown()),
    per_child: z.record(z.string(), z.unknown()),
    quiet_hours: z.record(z.string(), z.unknown()).nullable(),
    updated_at: Timestamp,
  })
  .loose();
export type NotificationPreference = z.infer<typeof NotificationPreference>;

export const { array: NotificationPreferenceList, parse: parseNotificationPreferencesJson } =
  collectionHelpers(NotificationPreference);
