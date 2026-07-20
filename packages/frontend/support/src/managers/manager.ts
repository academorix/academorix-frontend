/**
 * @file manager.ts
 * @module @stackra/support/managers
 * @description Abstract base Manager class — single-driver pattern.
 *
 *   Provides lazy driver resolution with caching, custom driver extension,
 *   and default driver switching. Subclasses implement `getDefaultDriver()`
 *   and `create{Name}Driver()` methods for each supported driver.
 *
 *   Inspired by Laravel's `Illuminate\Support\Manager`.
 *
 *   Use for: LoggerManager, AuthManager, BroadcastManager, NotificationManager
 *   (services with ONE active driver at a time, switchable).
 *
 * @example
 * ```typescript
 * class LogManager extends Manager<ILogChannel> {
 *   public getDefaultDriver(): string {
 *     return this.config.default; // e.g., 'stack'
 *   }
 *
 *   protected createConsoleDriver(): ILogChannel {
 *     return new ConsoleChannel(this.config.channels.console);
 *   }
 *
 *   protected createJsonDriver(): ILogChannel {
 *     return new JsonChannel(this.config.channels.json);
 *   }
 * }
 * ```
 */

import { Str } from "@/str";
import type { DriverCreator } from "../types";

// Re-export the type from its canonical home for consumers who only
// import from this module (`import { DriverCreator } from '../manager';`).
export type { DriverCreator } from "../types";

/**
 * Abstract Manager — resolves named drivers lazily with caching.
 *
 * @typeParam TDriver - The interface type that all drivers implement
 */
export abstract class Manager<TDriver = unknown> {
  /**
   * Cache of resolved driver instances.
   * Once a driver is created, it's stored here for subsequent calls.
   */
  protected drivers: Map<string, TDriver> = new Map();

  /**
   * Registry of custom driver creators added via `extend()`.
   * Takes priority over built-in `create{Name}Driver()` methods.
   */
  protected customCreators: Map<string, DriverCreator<TDriver>> = new Map();

  // ══════════════════════════════════════════════════════════════════════════
  // Abstract — subclasses must implement
  // ══════════════════════════════════════════════════════════════════════════

  /**
   * Get the name of the default driver.
   * Subclasses read this from their module configuration.
   *
   * @returns The default driver name (e.g., 'console', 'redis', 'sync')
   */
  public abstract getDefaultDriver(): string;

  // ══════════════════════════════════════════════════════════════════════════
  // Public API
  // ══════════════════════════════════════════════════════════════════════════

  /**
   * Get a driver instance by name. Uses the default if none specified.
   * Resolved instances are cached — subsequent calls return the same object.
   *
   * @param name - Driver name (defaults to `getDefaultDriver()`)
   * @returns The resolved driver instance
   * @throws Error if the driver is not supported
   */
  public driver(name?: string): TDriver {
    const driverName = name ?? this.getDefaultDriver();

    if (!driverName) {
      throw new Error(`Unable to resolve NULL driver for [${this.constructor.name}].`);
    }

    // Return cached instance if already resolved
    const cached = this.drivers.get(driverName);
    if (cached) return cached;

    // Create and cache the driver
    const instance = this.createDriver(driverName);
    this.drivers.set(driverName, instance);
    return instance;
  }

  /**
   * Register a custom driver creator.
   * Custom creators take priority over built-in `create{Name}Driver()` methods.
   *
   * @param name - Driver name
   * @param creator - Factory function that produces the driver
   * @returns this (for chaining)
   *
   * @example
   * ```typescript
   * logManager.extend('datadog', () => new DatadogChannel(config));
   * ```
   */
  public extend(name: string, creator: DriverCreator<TDriver>): this {
    this.customCreators.set(name, creator);
    return this;
  }

  /**
   * Get all resolved driver instances.
   *
   * @returns Map of driver name → instance
   */
  public getDrivers(): Map<string, TDriver> {
    return this.drivers;
  }

  /**
   * Forget (discard) all resolved driver instances.
   * Next call to `driver()` will re-create them.
   *
   * @returns this (for chaining)
   */
  public forgetDrivers(): this {
    this.drivers.clear();
    return this;
  }

  /**
   * Forget a specific driver instance.
   *
   * @param name - Driver name to forget
   * @returns this (for chaining)
   */
  public forgetDriver(name: string): this {
    this.drivers.delete(name);
    return this;
  }

  // ══════════════════════════════════════════════════════════════════════════
  // Protected — resolution logic
  // ══════════════════════════════════════════════════════════════════════════

  /**
   * Create a new driver instance.
   * Checks custom creators first, then looks for a `create{Name}Driver()` method.
   *
   * @param name - Driver name
   * @returns New driver instance
   * @throws Error if driver is not supported
   */
  protected createDriver(name: string): TDriver {
    // Custom creator takes priority
    const creator = this.customCreators.get(name);
    if (creator) {
      return creator();
    }

    // Convention-based: create{StudlyName}Driver()
    const method = `create${Str.studly(name)}Driver` as keyof this;
    if (typeof this[method] === "function") {
      return (this[method] as () => TDriver)();
    }

    throw new Error(`Driver [${name}] is not supported by [${this.constructor.name}].`);
  }
}
