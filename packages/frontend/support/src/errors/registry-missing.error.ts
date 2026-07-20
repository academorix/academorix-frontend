/**
 * @file registry-missing.error.ts
 * @module @stackra/support/errors
 * @description Thrown when {@link BaseRegistry.getOrFail} (or a
 *   subclass equivalent) is called with a key that is not present
 *   in the registry.
 *
 *   `get()` returns `undefined` for missing keys (matching `Map.get`)
 *   — use that when the caller is prepared to handle absence.
 *   `getOrFail()` is the strict variant for code paths where the
 *   value is a hard prerequisite (resolver, dispatcher, …) and
 *   silently returning `undefined` would propagate a null-reference
 *   error further downstream.
 *
 *   @see {@link BaseRegistry.get} for the nullable variant.
 *   @see {@link BaseRegistry.getOrFail} for the strict variant.
 */

// ════════════════════════════════════════════════════════════════════════════════
// Error
// ════════════════════════════════════════════════════════════════════════════════

/**
 * Error thrown when a required registry lookup misses.
 *
 * The error carries both the missing key and the registry's class
 * name so logs and stack traces unambiguously identify the source
 * registry without the caller having to wrap-and-rethrow.
 */
export class RegistryMissingError extends Error {
  /**
   * The key that was not present in the registry. Typed as
   * `unknown` because registries may use string, symbol, or domain
   * objects as keys.
   */
  public readonly key: unknown;

  /**
   * The constructor name of the registry that raised the error
   * (e.g. `'LinkRegistry'`). Useful for log aggregation.
   */
  public readonly registry: string;

  /**
   * @param key - The missing key that triggered the error.
   * @param registry - The class name of the registry that
   *   reported the miss. Pass `this.constructor.name` from inside
   *   the registry itself.
   */
  public constructor(key: unknown, registry: string) {
    super(
      `Key [${RegistryMissingError.describe(key)}] not found in ${registry}. ` +
        `Make sure the entry is registered before this lookup happens.`,
    );
    this.name = "RegistryMissingError";
    this.key = key;
    this.registry = registry;
  }

  /**
   * Best-effort string representation of a registry key for error
   * messages. Symbols print as `Symbol(description)`; everything
   * else falls back to `String(key)`.
   *
   * @param key - The key value (typed as unknown).
   * @returns Human-readable description suitable for log output.
   */
  private static describe(key: unknown): string {
    if (typeof key === "symbol") return key.toString();
    return String(key);
  }
}
