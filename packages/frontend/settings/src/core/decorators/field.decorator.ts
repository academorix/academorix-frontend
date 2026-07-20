/**
 * @file field.decorator.ts
 * @module @stackra/settings/core/decorators
 * @description `@Field()` property decorator — declares a single
 *   setting field on a `@Setting()`-decorated DTO.
 *
 *   Field descriptors are collected on the constructor under
 *   {@link FIELD_METADATA_KEY} as a `Map<string, ISettingField>` so
 *   `SettingsRegistry.registerClass` can iterate them in registration
 *   order and merge in `@Group()` / `@Section()` associations.
 */

import { defineMetadata, getMetadata } from "@vivtel/metadata";
import {
  FIELD_METADATA_KEY,
  type ISettingField,
  type ISettingFieldOption,
  type ISettingValidationRule,
  type Type,
} from "@stackra/contracts";

/**
 * Options accepted by the `@Field()` property decorator.
 *
 * Mirrors `ISettingField` minus the auto-derived `key`, `group`, and
 * `section` fields.
 */
export type IFieldOptions = Omit<ISettingField, "key" | "group" | "section"> & {
  /**
   * UI control type. Accepts a {@link ControlType} case for the
   * built-ins or any custom string for a bespoke renderer. Defaults
   * to `ControlType.Text` (`'text'`) when omitted.
   */
  readonly control?: ISettingField["control"];
  /** Default value used when no stored value exists yet. */
  readonly defaultValue: unknown;
  /** Static options for select-family fields. */
  readonly options?: readonly ISettingFieldOption[];
  /** Validation rules applied on update. */
  readonly validation?: readonly ISettingValidationRule[];
};

/**
 * Property decorator that declares a single setting field.
 *
 * @param options - Field metadata (control type, defaults, validation).
 * @returns A property decorator.
 *
 * @example
 * ```typescript
 * import { Setting, Field } from '@stackra/settings';
 * import { ControlType } from '@stackra/contracts';
 *
 * @Setting({ key: 'display', label: 'settings.display' })
 * class DisplaySettings {
 *   @Field({
 *     control: ControlType.Select,
 *     label: 'settings.display.theme',
 *     defaultValue: 'system',
 *     options: [
 *       { value: 'light', label: 'settings.display.theme.light' },
 *       { value: 'dark',  label: 'settings.display.theme.dark' },
 *       { value: 'system',label: 'settings.display.theme.system' },
 *     ],
 *   })
 *   theme: string = 'system';
 * }
 * ```
 */
export function Field(options: IFieldOptions): PropertyDecorator {
  return (target: object, propertyKey: string | symbol) => {
    // The constructor is where we hang the per-property map; using it
    // rather than the prototype means the metadata survives class
    // extension without leaking across subclasses.
    const constructor = target.constructor as object;
    const existing = getMetadata<Map<string, ISettingField>>(FIELD_METADATA_KEY, constructor);
    const map = existing ?? new Map<string, ISettingField>();

    const descriptor: ISettingField = {
      key: String(propertyKey),
      control: options.control ?? "text",
      label: options.label ?? "",
      description: options.description,
      placeholder: options.placeholder,
      defaultValue: options.defaultValue,
      options: options.options,
      optionsProvider: options.optionsProvider,
      min: options.min,
      max: options.max,
      step: options.step,
      validation: options.validation,
      order: options.order,
      icon: options.icon,
      visibleWhen: options.visibleWhen,
      readOnly: options.readOnly,
      sensitive: options.sensitive,
      requiresRestart: options.requiresRestart,
      permissions: options.permissions,
      writePermissions: options.writePermissions,
      meta: options.meta,
    };

    map.set(String(propertyKey), descriptor);
    // Re-define — `@vivtel/metadata` overwrites on set, so we can
    // safely round-trip the same map reference every call.
    defineMetadata(FIELD_METADATA_KEY, map, constructor);
  };
}

/**
 * Read every `@Field()` descriptor off a DTO class, sorted by
 * declaration order then by `order` when supplied.
 *
 * @param dto - The DTO constructor.
 */
export function getFieldDescriptors(dto: Type): readonly ISettingField[] {
  const map = getMetadata<Map<string, ISettingField>>(FIELD_METADATA_KEY, dto as object);
  if (!map) return [];

  return Array.from(map.values()).sort((a, b) => {
    const orderA = a.order ?? 0;
    const orderB = b.order ?? 0;
    if (orderA !== orderB) return orderA - orderB;
    return a.key.localeCompare(b.key);
  });
}
