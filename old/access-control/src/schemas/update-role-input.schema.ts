/**
 * @file update-role-input.schema.ts
 * @module @academorix/access-control/schemas
 * @description Zod schema mirroring `Academorix\Access\Data\Requests\UpdateRoleRequestData`.
 */

import { z } from "zod";

/**
 * Zod schema validating the update-role request body.
 */
export const updateRoleInputSchema = z
  .object({
    label: z.string().min(1).max(255).optional(),
    description: z.string().max(1000).nullish(),
  })
  .refine((v) => v.label !== undefined || v.description !== undefined, {
    message: "at least one field must be provided",
  });

export type UpdateRoleInputSchema = z.infer<typeof updateRoleInputSchema>;
