/**
 * @file setting.decorator.ts
 * @module @stackra/settings/core/decorators
 * @description `@Setting()` class decorator — marks a class as a
 *   settings-group DTO for `SettingsRegistry.registerClass`.
 *
 *   Group-level metadata is stored under {@link SETTING_METADATA_KEY}
 *   via `@vivtel/metadata`. `SettingsRegistry` reads it back with the
 *   companion `getSettingMetadata` helper below.
 */

import { defineMetadata, getMetadata } from '@vivtel/metadata';
import { SETTING_METADATA_KEY, type Type, type SettingScope } from '@stackra/contracts';

/**
 * Options accepted by the `@Setting()` class decorator.
 *
 * Mirrors the surface of the Laravel `#[AsSetting]` attribute so a
 * single DTO can be authored client-side and produce a compatible
 * schema when serialized to the server.
 */
export interface ISettingOptions {
  /**
   * Unique group key — matches the API route segment
   * (`/api/v1/settings/{key}`). Snake-case or kebab-case by
   * convention.
   */
  readonly key: string;

  /** Display label (plain string or i18n key). */
  readonly label: string;

  /** Optional description surfaced in the admin UI. */
  readonly description?: string;

  /**
   * Icon identifier resolved by the React layer via
   * `@stackra/ui/icons/*` or an app-provided registry.
   */
  readonly icon?: string;

  /** Display order relative to other groups. */
  readonly order?: number;

  /**
   * Hierarchy scope — controls how the group participates in the
   * resolution chain. Defaults to `system`.
   */
  readonly scope?: SettingScope;

  /**
   * When `true`, the read endpoint is publicly accessible without
   * authentication. Defaults to `false`.
   */
  readonly public?: boolean;

  /** Permission strings required to view this group. */
  readonly permissions?: readonly string[];

  /** Permission strings required to modify this group. */
  readonly writePermissions?: readonly string[];

  /** Arbitrary metadata for custom consumers. */
  readonly meta?: Readonly<Record<string, unknown>>;
}

/**
 * Class decorator that marks a class as a settings-group DTO.
 *
 * @param options - Group-level metadata.
 * @returns A class decorator.
 *
 * @example
 * ```typescript
 * import { Setting, Field, Group } from '@stackra/settings';
 * import { ControlType, SettingScope } from '@stackra/contracts';
 *
 * @Setting({
 *   key: 'display',
 *   label: 'settings.display.title',
 *   icon: 'monitor',
 *   scope: SettingScope.User,
 *   order: 1,
 * })
 * class DisplaySettings {
 *   @Field({ control: ControlType.Toggle, defaultValue: false, label: 'settings.display.compact' })
 *   compact: boolean = false;
 * }
 * ```
 */
export function Setting(options: ISettingOptions): ClassDecorator {
  return (target: Function) => {
    defineMetadata(SETTING_METADATA_KEY, options, target);
  };
}

/**
 * Read the `@Setting()` metadata off a DTO class. Returns `undefined`
 * when the class is not decorated.
 *
 * @param target - The DTO constructor.
 */
export function getSettingMetadata(target: Type): ISettingOptions | undefined {
  return getMetadata<ISettingOptions>(SETTING_METADATA_KEY, target as object);
}
