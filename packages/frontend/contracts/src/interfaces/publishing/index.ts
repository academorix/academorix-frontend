/**
 * @file index.ts
 * @module @stackra/contracts/interfaces/publishing
 * @description Public API barrel for the publishing interfaces. Every
 *   module in the workspace that ships publishable resources imports
 *   these shapes through `@stackra/contracts` (per contract-reexports.md).
 */

export type { IHasPublishables } from "./has-publishables.interface";
export type { IPublishableConsumer } from "./publishable-consumer.interface";
export type { IPublishableEntry } from "./publishable-entry.interface";
export type { IPublishableFile } from "./publishable-file.interface";
export type { IPublishableRegistryEntry } from "./publishable-registry-entry.interface";
