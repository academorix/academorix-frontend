/**
 * @file settings-registry.interface.ts
 * @module @stackra/contracts/interfaces/settings
 * @description The `ISettingsRegistry` contract — schema-side registry
 *   for every setting group (client-declared DTO or server-declared
 *   JSON schema).
 *
 *   Both paths (`registerClass` for DTOs, `registerFromSchema` for
 *   API-driven groups) populate the same underlying map, so
 *   downstream consumers stay source-agnostic.
 */

import type { Type } from "../type.interface";
import type { ISettingDefinition } from "./setting-definition.interface";

/**
 * Registry of every registered setting group.
 *
 * Populated at boot by `SettingsModule.forFeature([Dto, ...])` and /
 * or `SettingsSchemaFetcher.onModuleInit`. Read by the service, the
 * broadcast listener, and the React renderer.
 */
export interface ISettingsRegistry {
  /**
   * Register a client-declared DTO decorated with `@Setting()`.
   *
   * Reads class-level metadata via {@link SETTING_METADATA_KEY} and
   * property-level metadata via the field / group / section keys.
   *
   * @throws When the class is not decorated with `@Setting()` or the
   *   group key is already registered.
   */
  registerClass(dto: Type): void;

  /**
   * Register a group from a plain JSON schema (typically the payload
   * returned by `GET /api/v1/settings/schema`).
   *
   * No `@Setting()` / `@Field()` decorators are required — the
   * schema drives every downstream renderer.
   *
   * @throws When the group key is already registered.
   */
  registerFromSchema(schema: ISettingDefinition): void;

  /** Register many schemas at once. */
  registerManyFromSchema(schemas: readonly ISettingDefinition[]): void;

  /** Look up a registered group by key. */
  get(key: string): ISettingDefinition | undefined;

  /** Look up a registered group by its DTO constructor. */
  findByDto(dto: Type): ISettingDefinition | undefined;

  /** Every registered group sorted by `order`. */
  all(): readonly ISettingDefinition[];

  /** Whether a group is registered. */
  has(key: string): boolean;

  /** Number of registered groups. */
  readonly size: number;

  /** Clear every registered group (used when re-loading schema). */
  clear(): void;
}
