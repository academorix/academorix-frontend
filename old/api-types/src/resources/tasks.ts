/**
 * tasks.json — auto-scaffolded from the mock fixture shape.
 *
 * Every field mirrors an observed field in tasks.json. Nullability and
 * optionality reflect the actual JSON (a field is nullable if it ever
 * appears as null; optional if it is missing from at least one record).
 * ID fields are branded — see ../ids.ts. Closed enums live in ../enums.ts.
 */
import { z } from "zod";

import { Timestamp } from "../common.js";
import { Priority, TaskStatus } from "../enums.js";
import { TaskId, TenantId, UserId } from "../ids.js";

import { collectionHelpers } from "./_helpers.js";

export const Task = z
  .object({
    id: TaskId,
    tenant_id: TenantId,
    related_type: z.enum(["lead", "registration"]),
    related_id: z.string(),
    title: z.string(),
    description: z.string(),
    assigned_to_user_id: UserId,
    due_at: Timestamp,
    status: TaskStatus,
    priority: Priority,
    completed_at: Timestamp.nullable(),
    created_at: Timestamp,
    updated_at: Timestamp,
  })
  .loose();
export type Task = z.infer<typeof Task>;

export const { array: TaskList, parse: parseTasksJson } = collectionHelpers(Task);
