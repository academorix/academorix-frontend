/**
 * @file fluent.ts
 * @module @stackra/support
 * @description Fluent configuration builder with Proxy-based dynamic access.
 *   Stores key-value attributes and provides typed get/set access along with
 *   Proxy-based dynamic property access for ergonomic usage.
 */

// ════════════════════════════════════════════════════════════════════════════════
// Fluent Class
// ════════════════════════════════════════════════════════════════════════════════

/**
 * Fluent configuration object with dynamic property access.
 *
 * Wraps a plain object and provides typed `get()`/`set()` methods plus
 * Proxy-based dynamic access for ergonomic property reading and writing.
 *
 * Useful for building configuration objects, option bags, and query builders
 * where you want both type safety and dynamic access.
 *
 * @typeParam T - The shape of the attributes object
 *
 * @example
 * ```typescript
 * import { Fluent } from '@stackra/support';
 *
 * const config = Fluent.make({ host: 'localhost', port: 3000 });
 *
 * // Typed get/set
 * config.get('host');           // 'localhost'
 * config.set('port', 8080);
 *
 * // Dynamic access via Proxy
 * config.host;                  // 'localhost'
 * config.port;                  // 8080
 *
 * // Serialize
 * config.toObject();           // { host: 'localhost', port: 8080 }
 * ```
 */
export class Fluent<T extends Record<string, unknown>> {
  /** Internal attribute storage. */
  private attributes: T;

  /**
   * Create a new Fluent instance.
   *
   * @param attributes - Initial attribute values
   */
  public constructor(attributes: T) {
    this.attributes = { ...attributes };
  }

  // ══════════════════════════════════════════════════════════════════════════
  // Static Factory
  // ══════════════════════════════════════════════════════════════════════════

  /**
   * Create a new Fluent instance wrapped in a Proxy for dynamic property access.
   *
   * The returned value can be used as both a Fluent instance (with get/set/toObject)
   * and as a plain object (direct property access).
   *
   * @typeParam T - The shape of the attributes
   * @param attributes - Initial attribute values
   * @returns A Proxy-wrapped Fluent instance
   *
   * @example
   * ```typescript
   * const cfg = Fluent.make({ debug: true, level: 'info' });
   * cfg.debug;             // true
   * cfg.get('level');      // 'info'
   * cfg.set('level', 'warn');
   * cfg.toObject();        // { debug: true, level: 'warn' }
   * ```
   */
  public static make<T extends Record<string, unknown>>(attributes: T): Fluent<T> & T {
    const instance = new Fluent<T>(attributes);

    return new Proxy(instance, {
      /**
       * Intercept property access — check Fluent methods first, then attributes.
       *
       * @param target - The Fluent instance
       * @param prop - The property name being accessed
       * @returns The method, or the attribute value
       */
      get(target: Fluent<T>, prop: string | symbol): unknown {
        // If it's a known method on the Fluent class, return it bound
        if (typeof prop === "string" && prop in target) {
          const value = (target as unknown as Record<string, unknown>)[prop];
          if (typeof value === "function") {
            return value.bind(target);
          }
          return value;
        }

        // Otherwise look in attributes
        if (typeof prop === "string") {
          return target.get(prop as keyof T);
        }

        return undefined;
      },

      /**
       * Intercept property assignment — delegate to Fluent.set().
       *
       * @param target - The Fluent instance
       * @param prop - The property name being set
       * @param value - The value to set
       * @returns true (required by Proxy)
       */
      set(target: Fluent<T>, prop: string | symbol, value: unknown): boolean {
        if (typeof prop === "string") {
          target.set(prop as keyof T, value as T[keyof T]);
        }
        return true;
      },
    }) as Fluent<T> & T;
  }

  // ══════════════════════════════════════════════════════════════════════════
  // Public API
  // ══════════════════════════════════════════════════════════════════════════

  /**
   * Get an attribute value by key.
   *
   * @param key - The attribute key
   * @returns The attribute value, or undefined if not set
   *
   * @example
   * ```typescript
   * fluent.get('host'); // 'localhost'
   * ```
   */
  public get<K extends keyof T>(key: K): T[K] {
    return this.attributes[key];
  }

  /**
   * Set an attribute value by key.
   *
   * @param key - The attribute key
   * @param value - The value to set
   * @returns this (for chaining)
   *
   * @example
   * ```typescript
   * fluent.set('port', 8080).set('host', '0.0.0.0');
   * ```
   */
  public set<K extends keyof T>(key: K, value: T[K]): this {
    this.attributes[key] = value;
    return this;
  }

  /**
   * Check if an attribute exists and is not undefined.
   *
   * @param key - The attribute key
   * @returns True if the attribute exists
   *
   * @example
   * ```typescript
   * fluent.has('host'); // true
   * fluent.has('missing'); // false
   * ```
   */
  public has<K extends keyof T>(key: K): boolean {
    return this.attributes[key] !== undefined;
  }

  /**
   * Serialize the attributes to a plain object.
   *
   * @returns A shallow copy of the internal attributes
   *
   * @example
   * ```typescript
   * fluent.toObject(); // { host: 'localhost', port: 3000 }
   * ```
   */
  public toObject(): T {
    return { ...this.attributes };
  }
}
