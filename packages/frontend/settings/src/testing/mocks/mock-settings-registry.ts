/**
 * @file mock-settings-registry.ts
 * @module @stackra/settings/testing/mocks
 * @description In-memory `ISettingsRegistry` implementation for
 *   tests. Deliberately does not delegate to `@vivtel/metadata` so
 *   tests can spin one up without decorators.
 */

import type { ISettingDefinition, ISettingsRegistry, Type } from "@stackra/contracts";

/** Minimal `ISettingsRegistry` mock backed by a plain `Map`. */
export class MockSettingsRegistry implements ISettingsRegistry {
  /** Internal storage. */
  private readonly definitions = new Map<string, ISettingDefinition>();

  /** @inheritDoc */
  public registerClass(dto: Type): void {
    throw new Error(
      `[MockSettingsRegistry] registerClass is not implemented — tests should ` +
        `call registerFromSchema(${dto.name}) with a hand-rolled definition.`,
    );
  }

  /** @inheritDoc */
  public registerFromSchema(schema: ISettingDefinition): void {
    this.definitions.set(schema.key, { ...schema, dto: schema.dto ?? null });
  }

  /** @inheritDoc */
  public registerManyFromSchema(schemas: readonly ISettingDefinition[]): void {
    for (const schema of schemas) this.registerFromSchema(schema);
  }

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
}
