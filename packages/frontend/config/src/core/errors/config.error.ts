/**
 * @file config.error.ts
 * @module @stackra/config/core/errors
 * @description Base error class for every failure raised by
 *   `@stackra/config`. Consumers use a single `instanceof ConfigError`
 *   check to catch the whole family.
 *
 *   **Stackra addition** — `@nestjs/config` throws plain `Error` /
 *   `TypeError`. Ours pins a `code` on every error so consumers can
 *   branch without brittle message-substring matches.
 */

/**
 * Base error thrown by every `@stackra/config` failure path.
 *
 * Each subclass pins a stable `code` (`CONFIG_MISSING_KEY`,
 * `CONFIG_VALIDATION`, `CONFIG_ENV_MISSING`, …) so consumers can
 * discriminate without parsing `.message`. The class is `abstract`
 * only conceptually — the runtime constructor is concrete so tests
 * can synthesize it, but application code should always instantiate
 * a subclass with a specific code.
 *
 * @example
 * ```typescript
 * try {
 *   configService.getOrThrow('missing');
 * } catch (err) {
 *   if (err instanceof ConfigError) {
 *     console.error(err.code, err.message);
 *   }
 * }
 * ```
 */
export class ConfigError extends Error {
  /**
   * Stable machine-readable identifier for the failure. Each subclass
   * overrides the constructor default to pin the value for its
   * category.
   */
  public readonly code: string;

  /**
   * Construct a base ConfigError with an explicit code.
   *
   * @param message - Human-readable failure description.
   * @param code - Stable machine-readable identifier (subclass-owned).
   */
  public constructor(message: string, code: string = "CONFIG_ERROR") {
    super(message);
    // Fixed name so log formatters print `ConfigError: ...` rather
    // than `Error: ...`. Doing it in the constructor (rather than as
    // a class field) keeps the value in sync when the class is
    // extended.
    this.name = this.constructor.name;
    this.code = code;
  }
}
