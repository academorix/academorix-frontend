/**
 * @file create-role-input.schema.ts
 * @module @academorix/access-control/schemas
 * @description Zod schema mirroring `Academorix\Access\Data\Requests\CreateRoleRequestData`.
 */

import { z } from "zod";

import { Guard } from "@academorix/contracts";

/**
 * Zod schema validating the create-role request body.
 */
export const createRoleInputSchema = z.object({
  name: z
    .string()
    .min(1)
    .max(128)
    .regex(/^[a-z][a-z0-9_-]*$/, "name must be lower_snake or lower-kebab"),
  label: z.string().min(1).max(255),
  description: z.string().max(1000).nullish(),
  guard: z.enum([Guard.Platform, Guard.Tenant]),
  /**
   * Optional permission-name array to attach on creation. Alternative
   * to a separate `syncRolePermissions` call — set here to persist
   * the role + attach permissions atomically.
   */
  permissions: z.array(z.string()).optional(),
});

export type CreateRoleInputSchema = z.infer<typeof createRoleInputSchema>;
