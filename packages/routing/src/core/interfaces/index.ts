/**
 * @file index.ts
 * @module @stackra/routing/core/interfaces
 * @description Public API barrel for package-owned interfaces.
 *
 *   Every interface here is INTERNAL to the routing runtime — domain
 *   interfaces used across packages live in `@stackra/contracts`.
 */

export type { IGuardEntry } from "./guard-entry.interface";
export type { IMiddlewareEntry } from "./middleware-entry.interface";
export type { IMiddlewareGroup } from "./middleware-group.interface";
export type {
  IPipelineEntryKind,
  IResolvedPipelineEntry,
} from "./resolved-pipeline-entry.interface";
export type { IPipelineResolutionInput } from "./pipeline-resolution-input.interface";
