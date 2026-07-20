/**
 * @file group.decorator.ts
 * @module @stackra/settings/core/decorators
 * @description `@Group()` property decorator — assigns a field to a
 *   visual sub-section within a settings class.
 *
 *   Groups are collected as a `Map<groupKey, ISettingVisualGroup>` on
 *   the constructor under {@link GROUP_METADATA_KEY}. Each field
 *   decorator sets its `group` reference to the visual group's `key`,
 *   which `SettingsRegistry.registerClass` then merges into the
 *   `ISettingField` shape.
 */

import { defineMetadata, getMetadata } from "@vivtel/metadata";
import {
  FIELD_METADATA_KEY,
  GROUP_METADATA_KEY,
  type ISettingField,
  type ISettingVisualGroup,
  type Type,
} from "@stackra/contracts";

/**
 * Options accepted by the `@Group()` property decorator.
 */
export type IGroupOptions = Omit<ISettingVisualGroup, "fieldKeys">;

/**
 * Internal representation of the visual group as it accumulates on
 * the constructor — collects field keys as decorators fire.
 */
interface IGroupState {
  readonly meta: IGroupOptions;
  readonly fieldKeys: string[];
}

/**
 * Property decorator that assigns a field to a named visual group.
 *
 * Multiple properties can carry the same `@Group()` call — the
 * accumulator ensures they all end up as `fieldKeys` on the same
 * group entry.
 *
 * @param options - Visual group metadata.
 * @returns A property decorator.
 *
 * @example
 * ```typescript
 * @Setting({ key: 'terminal', label: 'settings.terminal.title' })
 * class TerminalSettings {
 *   @Group({ key: 'identity', label: 'settings.terminal.identity' })
 *   @Field({ control: ControlType.Text, defaultValue: '', label: 'settings.terminal.id' })
 *   terminalId: string = '';
 *
 *   @Group({ key: 'identity', label: 'settings.terminal.identity' })
 *   @Field({ control: ControlType.Text, defaultValue: '', label: 'settings.terminal.name' })
 *   name: string = '';
 * }
 * ```
 */
export function Group(options: IGroupOptions): PropertyDecorator {
  return (target: object, propertyKey: string | symbol) => {
    const constructor = target.constructor as object;

    // Update the group map on the constructor.
    const groups =
      getMetadata<Map<string, IGroupState>>(GROUP_METADATA_KEY, constructor) ??
      new Map<string, IGroupState>();

    const existing = groups.get(options.key);
    if (existing) {
      existing.fieldKeys.push(String(propertyKey));
    } else {
      groups.set(options.key, {
        meta: options,
        fieldKeys: [String(propertyKey)],
      });
    }
    defineMetadata(GROUP_METADATA_KEY, groups, constructor);

    // Also tag the matching @Field descriptor with the group's key so
    // downstream lookups by field are cheap.
    const fields = getMetadata<Map<string, ISettingField>>(FIELD_METADATA_KEY, constructor);
    const field = fields?.get(String(propertyKey));
    if (field) {
      // ISettingField is readonly by contract but the DTO is a
      // mutable authoring shape — cast is scoped to this augmentation.
      (field as { group?: string }).group = options.key;
    }
  };
}

/**
 * Read every `@Group()` descriptor off a DTO class, sorted by
 * `order`. Field keys accumulated across multiple decorator calls
 * are surfaced under each group's `fieldKeys`.
 *
 * @param dto - The DTO constructor.
 */
export function getGroupDescriptors(dto: Type): readonly ISettingVisualGroup[] {
  const map = getMetadata<Map<string, IGroupState>>(GROUP_METADATA_KEY, dto as object);
  if (!map) return [];

  return Array.from(map.values())
    .map((entry) => ({ ...entry.meta, fieldKeys: entry.fieldKeys }))
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
}
