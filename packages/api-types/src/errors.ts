/**
 * Standard error + response-envelope shapes.
 *
 * These mirror what a Laravel API returns: a single `data` payload, optional
 * pagination metadata, and an optional array of error entries. Validation
 * errors use the standard Laravel field-map (`errors: { field: [msg, ...] }`).
 */

import { z } from "zod";

// -------- ApiError --------

export const ApiError = z.object({
  code: z.string(),
  message: z.string(),
  detail: z.string().optional(),
  meta: z.record(z.string(), z.unknown()).optional(),
});
export type ApiError = z.infer<typeof ApiError>;

// -------- ValidationError --------

/**
 * Laravel-style validation error. `errors` is a bag of arrays keyed by
 * field name — every field can have multiple messages.
 */
export const ValidationError = ApiError.extend({
  code: z.literal("validation_error"),
  errors: z.record(z.string(), z.array(z.string())),
});
export type ValidationError = z.infer<typeof ValidationError>;

// -------- PaginationMeta --------

/**
 * Cursor-based pagination meta. `total` is optional because cursor pagination
 * does not always emit a total; the API includes it opportunistically.
 */
export const PaginationMeta = z.object({
  cursor: z.string().nullable(),
  next_cursor: z.string().nullable(),
  per_page: z.number().int().positive(),
  total: z.number().int().nonnegative().optional(),
});
export type PaginationMeta = z.infer<typeof PaginationMeta>;

// -------- ApiEnvelope --------

/**
 * Wrap any resource schema in the standard `{ data, meta, errors }` envelope.
 * Use it when the endpoint returns a single record or a collection.
 *
 * ```ts
 * import { Athlete } from "@academorix/api-types";
 * const AthleteResponse = ApiEnvelope(Athlete);
 * const AthleteListResponse = ApiEnvelope(z.array(Athlete));
 * ```
 */
export const ApiEnvelope = <T extends z.ZodTypeAny>(dataSchema: T) =>
  z.object({
    data: dataSchema,
    meta: PaginationMeta.partial().optional(),
    errors: z.array(ApiError).optional(),
  });
