/**
 * @file settings.registry.ts
 * @module @stackra/settings/core/registries
 * @description Central registry of every setting group.
 *
 *   Accepts BOTH client-declared DTO classes (via `registerClass`,
 *   which reads `@Setting()` / `@Field()` / `@Group()` / `@Section()`
 *   metadata) AND server-declared JSON schemas (via
 *   `registerFromSchema`). Both paths converge on the same
 *   `ISettingDefinition` shape so downstream code stays source-
 *   agnostic.
 */

import { Injectable, Optional, Inject } from "@stackra/container";
import {
  LOGGER_MANAGER,
  type ISettingDefinition,
  type ISettingsRegistry,
  type ISettingSection,
  type ILoggerManager,
  type Type,
} from "@stackra/contracts";

import {
  getFieldDescriptors,
  getGroupDescriptors,
  getSectionDescriptors,
  getSettingMetadata,
} from "@/core/decorators";
import { SettingsError } from "@/core/errors";

/**
 * In-memory registry of every registered setting group.
 *
 * Populated at boot by `SettingsModule.forFeature([Dto])` and / or by
 * `SettingsSchemaLoader` when the API is configured. Read by the
 * service, the broadcast listener, and the React renderer.
 */
@Injectable()
export class SettingsRegistry implements ISettingsRegistry {
  /** Internal storage keyed by group key. */
  private readonly definitions = new Map<string, ISettingDefinition>();

  /**
   * @param logger - Optional logger for warnings (e.g. a DTO with no
   *   `@Field()` properties, an overwrite via `registerFromSchema`).
   */
  public constructor(
    @Optional() @Inject(LOGGER_MANAGER) private readonly logger?: ILoggerManager,
  ) {}

  // ══════════════════════════════════════════════════════════════════
  // Registration
  // ══════════════════════════════════════════════════════════════════

  /**
   * Register a client-declared DTO decorated with `@Setting()`.
   *
   * @throws {SettingsError} When the class is not decorated with
   *   `@Setting()` or the group key is already registered.
   */
  public registerClass(dto: Type): void {
    const meta = getSettingMetadata(dto);
    if (!meta) {
      throw new SettingsError(
        `Class "${dto.name}" is not decorated with @Setting(). ` +
          `Add @Setting({ key, label, ... }) to the class.`,
      );
    }

    if (this.definitions.has(meta.key)) {
      throw new SettingsError(
        `Settings group "${meta.key}" is already registered. ` + `Each group key must be unique.`,
      );
    }

    // Collect field / group / section metadata written by the
    // property decorators.
    const fields = getFieldDescriptors(dto);
    const groups = getGroupDescriptors(dto);
    const sectionMap = getSectionDescriptors(dto);

    if (fields.length === 0) {
      this.warn(`DTO "${dto.name}" (group "${meta.key}") has no @Field() properties.`);
    }

    // Serialize the section map into a plain record for the
    // ISettingDefinition contract shape.
    const sections: Record<string, ISettingSection> = {};
    for (const [key, section] of sectionMap) sections[key] = section;

    const definition: ISettingDefinition = {
      key: meta.key,
      label: meta.label,
      description: meta.description,
      icon: meta.icon,
      order: meta.order ?? 0,
      scope: meta.scope,
      public: meta.public,
      permissions: meta.permissions,
      writePermissions: meta.writePermissions,
      dto,
      fields,
      groups,
      sections: Object.keys(sections).length > 0 ? sections : undefined,
      meta: meta.meta,
    };

    this.definitions.set(meta.key, definition);
  }

  /**
   * Register a group from a plain JSON schema — typically the payload
   * returned by `GET /api/v1/settings/schema`.
   *
   * @throws {SettingsError} When the group key is already registered.
   */
  public registerFromSchema(schema: ISettingDefinition): void {
    if (this.definitions.has(schema.key)) {
      throw new SettingsError(`Settings group "${schema.key}" is already registered.`);
    }

    // Schema-driven registrations never have a DTO — normalize the
    // field list to always be an array (schemas from the wire may
    // arrive with `undefined`).
    const definition: ISettingDefinition = {
      ...schema,
      dto: null,
      fields: schema.fields ?? [],
      groups: schema.groups ?? [],
    };

    this.definitions.set(schema.key, definition);
  }

  /** Bulk-register a list of schemas. */
  public registerManyFromSchema(schemas: readonly ISettingDefinition[]): void {
    for (const schema of schemas) {
      // The single-item path throws on collision; catch and re-throw
      // wrapped so the caller sees which group in the batch failed.
      try {
        this.registerFromSchema(schema);
      } catch (error) {
        this.warn(`Failed to register group "${schema.key}" from schema.`, error);
      }
    }
  }

  // ══════════════════════════════════════════════════════════════════
  // Lookup
  // ══════════════════════════════════════════════════════════════════

  /** @inheritDoc */
  public get(key: string): ISettingDefinition | undefined {
    return this.definitions.get(key);
  }

  /** @inheritDoc */
  public findByDto(dto: Type): ISettingDefinition | undefined {
    for (const definition of this.definitions.values()) {
      if (definition.dto === dto) return definition;
    }
    return undefined;
  }

  /** @inheritDoc */
  public all(): readonly ISettingDefinition[] {
    const list = Array.from(this.definitions.values());
    list.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    return list;
  }

  /** @inheritDoc */
  public has(key: string): boolean {
    return this.definitions.has(key);
  }

  /** @inheritDoc */
  public get size(): number {
    return this.definitions.size;
  }

  /** @inheritDoc */
  public clear(): void {
    this.definitions.clear();
  }

  // ══════════════════════════════════════════════════════════════════
  // Private
  // ══════════════════════════════════════════════════════════════════

  /**
   * Emit a warning through the optional logger. Fail-soft — never
   * throws if the logger fails.
   */
  private warn(message: string, cause?: unknown): void {
    if (!this.logger) return;
    try {
      const suffix = cause ? `: ${String(cause)}` : "";
      this.logger.create("settings").warn(`${message}${suffix}`);
    } catch {
      // Fail-soft — internal logging must never surface.
    }
  }
}
