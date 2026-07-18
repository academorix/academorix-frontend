/**
 * @file update-permission-input.schema.ts
 * @module @academorix/access-control/schemas
 * @description Zod schema mirroring `Academorix\Access\Data\Requests\UpdatePermissionRequestData`.
 */

import { z } from "zod";

/**
 * Zod schema validating the update-permission request body.
 * Only mutable fields — the backend blocks name / guard changes.
 */
export const updatePermissionInputSchema = z
  .object({
    label: z.string().min(1).max(255).optional(),
    description: z.string().max(1000).nullish(),
  })
  .refine((v) => v.label !== undefined || v.description !== undefined, {
    message: "at least one field must be provided",
  });

export type UpdatePermissionInputSchema = z.infer<typeof updatePermissionInputSchema>;
