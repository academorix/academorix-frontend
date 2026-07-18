/**
 * @file index.ts
 * @module @stackra/support/utils/mapped-types
 * @description Public API barrel for the mapped-type utility types —
 *   TS-level equivalents of NestJS's `@nestjs/mapped-types`, kept as
 *   types only (no runtime class-inheritance).
 */

export type { PartialType } from "./partial-type.type";
export type { PickType } from "./pick-type.type";
export type { OmitType } from "./omit-type.type";
export type { IntersectionType } from "./intersection-type.type";
