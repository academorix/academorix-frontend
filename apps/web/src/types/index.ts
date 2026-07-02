/**
 * @file index.ts
 * @module types
 *
 * @description
 * Barrel for the shared type layer. Import domain shapes, enums, and API
 * envelopes from `@/types` rather than reaching into individual files, e.g.:
 *
 * @example
 * ```ts
 * import type { Student, Identity } from "@/types";
 * import { ROLE_LABELS } from "@/types";
 * ```
 */

export * from "@/types/enums";
export * from "@/types/models";
export * from "@/types/api";
