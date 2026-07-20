/**
 * @file section.decorator.ts
 * @module @stackra/settings/core/decorators
 * @description `@Section()` property decorator — declares a visual
 *   divider preceding a single field in the admin UI.
 *
 *   Section metadata is stored as a `Map<fieldKey, ISettingSection>`
 *   on the constructor under {@link SECTION_METADATA_KEY}. Each
 *   field's `section` string is set to the section label so
 *   `SettingsRegistry.registerClass` can group fields under the
 *   matching heading.
 */

import { defineMetadata, getMetadata } from '@vivtel/metadata';
import {
  FIELD_METADATA_KEY,
  SECTION_METADATA_KEY,
  type ISettingField,
  type ISettingSection,
  type Type,
} from '@stackra/contracts';

/**
 * Options accepted by the `@Section()` property decorator.
 */
export type ISectionOptions = ISettingSection;

/**
 * Property decorator that inserts a visual section divider before a
 * field.
 *
 * @param options - Section metadata.
 * @returns A property decorator.
 *
 * @example
 * ```typescript
 * @Setting({ key: 'terminal', label: 'settings.terminal.title' })
 * class TerminalSettings {
 *   @Section({ label: 'settings.terminal.hardware' })
 *   @Field({ control: ControlType.Select, defaultValue: 'thermal', label: 'settings.terminal.receipt' })
 *   receiptFormat: string = 'thermal';
 * }
 * ```
 */
export function Section(options: ISectionOptions): PropertyDecorator {
  return (target: object, propertyKey: string | symbol) => {
    const constructor = target.constructor as object;
    const sections =
      getMetadata<Map<string, ISettingSection>>(SECTION_METADATA_KEY, constructor) ??
      new Map<string, ISettingSection>();

    sections.set(String(propertyKey), options);
    defineMetadata(SECTION_METADATA_KEY, sections, constructor);

    // Tag the matching @Field descriptor with the section label for
    // constant-time lookup in the renderer.
    const fields = getMetadata<Map<string, ISettingField>>(FIELD_METADATA_KEY, constructor);
    const field = fields?.get(String(propertyKey));
    if (field) {
      (field as { section?: string }).section = options.label;
    }
  };
}

/**
 * Read every `@Section()` descriptor keyed by field key.
 *
 * @param dto - The DTO constructor.
 */
export function getSectionDescriptors(dto: Type): ReadonlyMap<string, ISettingSection> {
  return (
    getMetadata<Map<string, ISettingSection>>(SECTION_METADATA_KEY, dto as object) ??
    new Map<string, ISettingSection>()
  );
}
