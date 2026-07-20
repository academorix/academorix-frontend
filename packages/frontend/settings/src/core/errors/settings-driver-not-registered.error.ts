/**
 * @file settings-driver-not-registered.error.ts
 * @module @stackra/settings/core/errors
 * @description Thrown when the store manager is asked to build an
 *   instance for a driver name that neither maps to a built-in
 *   `create{Driver}Driver` method nor to a runtime-registered
 *   `manager.extend(name, creator)` factory.
 */

import { SettingsError } from "./settings.error";

/**
 * Thrown when a store manager cannot resolve a named driver.
 *
 * The error suggests the `extend()` hook to register the missing
 * driver, matching the same guidance the storage / cache packages
 * emit on the same failure.
 */
export class SettingsDriverNotRegisteredError extends SettingsError {
  /** Driver name that could not be resolved. */
  public readonly driver: string;

  /**
   * Create a new driver-not-registered error.
   *
   * @param driver - Driver name that could not be resolved.
   */
  public constructor(driver: string) {
    super(
      `Settings driver "${driver}" is not registered. ` +
        `Use SettingsStoreManager.extend('${driver}', factory) ` +
        `to register a custom driver, or check the driver name spelling.`,
    );
    this.name = "SettingsDriverNotRegisteredError";
    this.driver = driver;
  }
}
