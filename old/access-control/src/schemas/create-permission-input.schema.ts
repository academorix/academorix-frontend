/**
 * @file create-permission-input.schema.ts
 * @module @academorix/access-control/schemas
 * @description Zod schema mirroring `Academorix\Access\Data\Requests\CreatePermissionRequestData`.
 */

import { z } from "zod";

import { Guard } from "@academorix/contracts";

/**
 * Zod schema validating the create-permission request body.
 * Consumer admin forms use this via React Hook Form + Zod
 * resolver. The backend rejects system-permission names.
 */
export const createPermissionInputSchema = z.object({
  name: z
    .string()
    .min(1, "name is required")
    .max(128)
    .regex(/^[a-z][a-z0-9._-]*$/, "name must be lower-kebab or dotted"),

  label: z.string().min(1, "label is required").max(255),

  description: z.string().max(1000).nullish(),

  guard: z.enum([Guard.Platform, Guard.Tenant]),
});

/** Inferred TS type — one source of truth. */
export type CreatePermissionInputSchema = z.infer<typeof createPermissionInputSchema>;
