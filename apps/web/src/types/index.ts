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
 * import type { Athlete, Identity, Season } from "@/types";
 * import { SEASON_STATUS_LABELS } from "@/types";
 * ```
 *
 * Files are split by bounded context (platform, access, people, structure,
 * scheduling, development, commerce, attributes) plus shared `base` + `enums`
 * and the transport `api` envelopes.
 */

export * from "@/types/base";
export * from "@/types/enums";
export * from "@/types/platform";
export * from "@/types/access";
export * from "@/types/people";
export * from "@/types/structure";
export * from "@/types/sports";
export * from "@/types/scheduling";
export * from "@/types/development";
export * from "@/types/commerce";
export * from "@/types/attributes";
export * from "@/types/api";
