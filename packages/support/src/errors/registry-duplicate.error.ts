/**
 * @file registry-duplicate.error.ts
 * @module @stackra/support/errors
 * @description Thrown when {@link BaseRegistry.register} is called
 *   with a key that is already present in the registry.
 *
 *   This is the **strict-by-default** behaviour: every registry in
 *   the monorepo prefers a loud failure over silent overwrites
 *   because duplicate registrations almost always indicate a
 *   misconfiguration (two packages claiming the same name, a feature
 *   module imported twice, …) rather than an intentional override.
 *
 *   Callers that DO want overwrite semantics use
 *   {@link BaseRegistry.replace} explicitly — the call site then
 *   documents the override intent in plain text.
 *
 *   @see {@link BaseRegistry.register} for the registration contract.
 *   @see {@link BaseRegistry.replace} for the explicit-overwrite escape hatch.
 */

// ════════════════════════════════════════════════════════════════════════════════
// Error
// ════════════════════════════════════════════════════════════════════════════════

/**
 * Error thrown when a duplicate key is rejected by a registry.
 *
 * The error carries both the offending key and the registry's class
 * name so logs and stack traces unambiguously identify the source
 * registry without the caller having to wrap-and-rethrow.
 */
export class RegistryDuplicateError extends Error {
  /**
   * The key that was already present in the registry. Typed as
   * `unknown` because registries may use string, symbol, or domain
   * objects as keys.
   */
  public readonly key: unknown;

  /**
   * The constructor name of the registry that raised the error
   * (e.g. `'CommandRegistry'`). Useful for log aggregation.
   */
  public readonly registry: string;

  /**
   * @param key - The duplicate key that triggered the error.
   * @param registry - The class name of the registry that rejected
   *   the duplicate. Pass `this.constructor.name` from inside the
   *   registry itself.
   */
  public constructor(key: unknown, registry: string) {
    super(
      `Cannot register duplicate key [${RegistryDuplicateError.describe(key)}] in ${registry}. ` +
        `Use replace() to overwrite the existing entry explicitly, or registerOrReplace() ` +
        `for idempotent semantics.`,
    );
    this.name = "RegistryDuplicateError";
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
