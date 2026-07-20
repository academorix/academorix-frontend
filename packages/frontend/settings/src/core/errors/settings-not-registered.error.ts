/**
 * @file settings-not-registered.error.ts
 * @module @stackra/settings/core/errors
 * @description Thrown when the service is asked to operate on a group
 *   that has not been registered in the `SettingsRegistry`.
 */

import { SettingsError } from "./settings.error";

/**
 * Thrown when a caller references a settings group that is neither
 * declared via `SettingsModule.forFeature([Dto])` nor loaded via
 * `registerFromSchema`.
 */
export class SettingsNotRegisteredError extends SettingsError {
  /** The group key or DTO name the caller tried to access. */
  public readonly groupIdentifier: string;

  /**
   * Create a new not-registered error.
   *
   * @param groupIdentifier - The group key or DTO class name.
   */
  public constructor(groupIdentifier: string) {
    super(
      `Settings group "${groupIdentifier}" is not registered. ` +
        `Register it via SettingsModule.forFeature([Dto]) or ` +
        `SettingsRegistry.registerFromSchema(schema).`,
    );
    this.name = "SettingsNotRegisteredError";
    this.groupIdentifier = groupIdentifier;
  }
}
