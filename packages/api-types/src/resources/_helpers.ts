/**
 * Small helpers shared by every resource schema.
 *
 * These are intentionally tiny and unopinionated — the resource files stay
 * readable by composing named schemas rather than importing a schema-builder
 * DSL.
 */

import { z } from "zod";

import { TenantScope, Timestamp } from "../common.js";

/**
 * Every fixture record carries `tenant_id`. Some centrally-defined records
 * (retention policies, benchmarks, some report definitions, people, sports)
 * set it to `null`.
 */
export const TenantId = TenantScope.nullable();

/**
 * Audit trailer that appears on almost every resource. `deleted_at` is
 * present only on soft-deleteable resources.
 */
export const AuditFields = {
  created_at: Timestamp,
  updated_at: Timestamp,
};

export const SoftDelete = {
  deleted_at: Timestamp.nullable().optional(),
};

/**
 * Build an array parser + a typed helper for parsing a raw JSON collection.
 * Every collection resource file exports one of these.
 */
export function collectionHelpers<T extends z.ZodTypeAny>(schema: T) {
  const array = z.array(schema);

  return {
    array,
    parse: (raw: unknown) => array.parse(raw),
    safeParse: (raw: unknown) => array.safeParse(raw),
  };
}
