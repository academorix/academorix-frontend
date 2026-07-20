/**
 * @file base-registry.ts
 * @module @stackra/support
 * @description Abstract base class for every typed key→value registry
 *   in the monorepo. Provides a Map-backed storage plus strict
 *   register / replace / remove / lookup operations and lifecycle
 *   hooks (`onRegister`, `onRemove`) for subclass extension.
 *
 *   ## Strict-by-default semantics
 *
 *   `register(key, value)` throws {@link RegistryDuplicateError} when
 *   `key` is already present. This is the **default** semantics
 *   monorepo-wide because duplicate registrations almost always
 *   indicate a misconfiguration (two packages claiming the same name,
 *   a feature module imported twice, …) and silent overwrites mask
 *   those bugs until production.
 *
 *   When a caller intentionally wants overwrite semantics, two
 *   escape hatches are available:
 *
 *     - {@link BaseRegistry.replace} — overwrites without throwing.
 *     - {@link BaseRegistry.registerOrReplace} — readable alias for
 *       `replace`; use it when the call-site reads as "either way".
 *
 *   ## Lookup
 *
 *   `get(key)` returns `undefined` for misses (matches `Map.get`).
 *   `getOrFail(key)` throws {@link RegistryMissingError} when the
 *   caller treats the lookup as a hard prerequisite.
 *
 *   ## Iteration protocol (Map-like)
 *
 *   `keys()`, `values()`, `entries()` mirror the JS Map iteration
 *   protocol so a registry behaves like a familiar collection.
 *   `count()` returns the size as a regular method (rather than a
 *   getter) for symmetry with the rest of the registry API.
 *
 *   ## Lifecycle hooks for subclasses
 *
 *   `protected onRegister(key, value)` fires AFTER the Map is
 *   updated by both `register` and `replace`. Subclasses use it for
 *   revision counters, secondary indexes, audit logs, or events.
 *
 *   `protected onRemove(key, value)` fires AFTER a successful
 *   `remove`. The previous value is passed so subclasses can clean
 *   up domain-specific state without re-reading the Map.
 *
 *   The hooks default to no-ops so subclasses opt in by overriding.
 *
 *   @see {@link RegistryDuplicateError}
 *   @see {@link RegistryMissingError}
 */

import { RegistryDuplicateError, RegistryMissingError } from "../errors";

// ════════════════════════════════════════════════════════════════════════════════
// BaseRegistry Class
// ════════════════════════════════════════════════════════════════════════════════

/**
 * Abstract key→value registry with strict-by-default semantics and
 * lifecycle hooks for subclass extension.
 *
 * Subclass this for every domain-specific registry in the monorepo:
 * commands, links, themes, SDUI resources, factories, etc. Multi-value
 * (`Map<K, V[]>`) registries do NOT fit this contract — use a
 * dedicated base or a bespoke class.
 *
 * @typeParam TKey - The key type (typically `string` or `symbol`).
 * @typeParam TValue - The value type.
 *
 * @example Basic subclass
 * ```typescript
 * import { BaseRegistry } from '@stackra/support';
 *
 * interface IValidator {
 *   validate(value: unknown): boolean;
 * }
 *
 * class ValidatorRegistry extends BaseRegistry<string, IValidator> {}
 *
 * const registry = new ValidatorRegistry();
 * registry.register('email', new EmailValidator());
 * registry.register('email', new OtherEmailValidator()); // throws RegistryDuplicateError
 * registry.replace('email', new OtherEmailValidator()); // OK — explicit overwrite
 * ```
 *
 * @example Lifecycle hooks
 * ```typescript
 * class ThemeRegistry extends BaseRegistry<string, IThemeConfig> {
 *   private revision = 0;
 *   protected override onRegister(): void {
 *     this.revision += 1;
 *   }
 *   protected override onRemove(): void {
 *     this.revision += 1;
 *   }
 *   public getRevision(): number {
 *     return this.revision;
 *   }
 * }
 * ```
 */
export abstract class BaseRegistry<TKey, TValue> {
  /**
   * Internal Map storage. Exposed as `protected` so subclasses can
   * read it directly when they need bulk-iteration paths that don't
   * fit `keys/values/entries`. Subclasses MUST NOT bypass the
   * lifecycle hooks by writing to `items` directly — use `register`
   * / `replace` / `remove` instead.
   */
  protected items: Map<TKey, TValue> = new Map();

  // ══════════════════════════════════════════════════════════════════════════
  // Registration
  // ══════════════════════════════════════════════════════════════════════════

  /**
   * Register a value under the given key with strict semantics.
   *
   * Throws {@link RegistryDuplicateError} when `key` is already
   * present. Callers that want overwrite semantics call
   * {@link replace} or {@link registerOrReplace} instead.
   *
   * Fires the `onRegister` lifecycle hook after the Map is updated.
   *
   * @param key - The registry key.
   * @param value - The value to register.
   * @returns `this` for chaining.
   * @throws {RegistryDuplicateError} when `key` is already present.
   *
   * @example
   * ```typescript
   * registry.register('json', new JsonSerializer());
   * registry.register('json', new OtherSerializer()); // throws
   * ```
   */
  public register(key: TKey, value: TValue): this {
    if (this.items.has(key)) {
      throw this.makeDuplicateError(key);
    }
    this.items.set(key, value);
    this.onRegister(key, value);
    return this;
  }

  /**
   * Register a value under the given key with overwrite semantics.
   *
   * Replaces any existing entry without throwing. Use this when the
   * call-site intentionally wants to override an earlier
   * registration (test fixtures, plugin overrides, themed variants).
   *
   * Fires the `onRegister` lifecycle hook after the Map is updated.
   *
   * @param key - The registry key.
   * @param value - The value to register.
   * @returns `this` for chaining.
   *
   * @example
   * ```typescript
   * registry.register('json', new JsonSerializer());
   * registry.replace('json', new BetterJsonSerializer()); // OK
   * ```
   */
  public replace(key: TKey, value: TValue): this {
    this.items.set(key, value);
    this.onRegister(key, value);
    return this;
  }

  /**
   * Readable alias for {@link replace}.
   *
   * Use at call-sites where the semantics are "register or update,
   * whichever applies". The behaviour is identical to `replace` —
   * the alternate name simply documents intent at the call-site.
   *
   * @param key - The registry key.
   * @param value - The value to register.
   * @returns `this` for chaining.
   *
   * @example
   * ```typescript
   * cache.registerOrReplace(key, value); // idempotent — same as replace
   * ```
   */
  public registerOrReplace(key: TKey, value: TValue): this {
    return this.replace(key, value);
  }

  // ══════════════════════════════════════════════════════════════════════════
  // Retrieval
  // ══════════════════════════════════════════════════════════════════════════

  /**
   * Get a value by key, returning `undefined` for misses.
   *
   * Matches the `Map.get` contract — pair with `??` or an explicit
   * check at the call-site when the value is optional. For required
   * lookups, use {@link getOrFail} instead.
   *
   * @param key - The registry key.
   * @returns The registered value, or `undefined` when not present.
   */
  public get(key: TKey): TValue | undefined {
    return this.items.get(key);
  }

  /**
   * Get a value by key with strict semantics.
   *
   * Throws {@link RegistryMissingError} when the key is not present.
   * Use this at call-sites where the value is a hard prerequisite
   * and an `undefined` would propagate a null-reference error
   * further downstream.
   *
   * @param key - The registry key.
   * @returns The registered value (guaranteed non-undefined).
   * @throws {RegistryMissingError} when `key` is not present.
   */
  public getOrFail(key: TKey): TValue {
    const value = this.items.get(key);
    if (value === undefined && !this.items.has(key)) {
      // Distinguish "missing key" from "key present with undefined
      // value" — the latter is unusual but technically permitted.
      throw this.makeMissingError(key);
    }
    return value as TValue;
  }

  /**
   * Check if a key is registered.
   *
   * @param key - The registry key.
   * @returns `true` if the key is present.
   */
  public has(key: TKey): boolean {
    return this.items.has(key);
  }

  // ══════════════════════════════════════════════════════════════════════════
  // Removal
  // ══════════════════════════════════════════════════════════════════════════

  /**
   * Remove a key from the registry.
   *
   * Fires the `onRemove` lifecycle hook with the previous value
   * after a successful removal. Returns `false` (no hook fires)
   * when the key was not present.
   *
   * @param key - The registry key to remove.
   * @returns `true` when the key existed and was removed.
   */
  public remove(key: TKey): boolean {
    const value = this.items.get(key);
    const existed = this.items.delete(key);
    if (existed) {
      // `as TValue` is safe: `delete` returned true only when the
      // entry existed, so `get` above returned the actual value.
      this.onRemove(key, value as TValue);
    }
    return existed;
  }

  /**
   * Remove every entry from the registry.
   *
   * Does NOT fire per-entry `onRemove` hooks — subclasses that need
   * to observe a bulk clear should override `clear()` itself.
   *
   * @returns `this` for chaining.
   */
  public clear(): this {
    this.items.clear();
    return this;
  }

  // ══════════════════════════════════════════════════════════════════════════
  // Inspection (Map-like iteration protocol)
  // ══════════════════════════════════════════════════════════════════════════

  /**
   * Snapshot every key.
   *
   * @returns Array of keys in insertion order.
   */
  public keys(): TKey[] {
    return Array.from(this.items.keys());
  }

  /**
   * Snapshot every value.
   *
   * @returns Array of values in insertion order.
   */
  public values(): TValue[] {
    return Array.from(this.items.values());
  }

  /**
   * Snapshot every key-value pair as `[key, value]` tuples.
   *
   * Matches the JS Map `entries()` shape. Use {@link values} when
   * keys aren't needed at the call-site.
   *
   * @returns Array of `[key, value]` tuples in insertion order.
   */
  public entries(): [TKey, TValue][] {
    return Array.from(this.items.entries());
  }

  /**
   * Get the number of registered entries.
   *
   * Provided as a method (not a getter) so the API surface stays
   * consistent across every registry in the monorepo. Subclasses
   * MUST NOT shadow this with a `size` getter or method — both
   * patterns make typing inheritance messier than it needs to be.
   *
   * @returns The count of entries in the registry.
   */
  public count(): number {
    return this.items.size;
  }

  // ══════════════════════════════════════════════════════════════════════════
  // Lifecycle hooks (subclass-override points)
  // ══════════════════════════════════════════════════════════════════════════

  /**
   * Lifecycle hook invoked after every successful `register` or
   * `replace`. Default implementation is a no-op.
   *
   * Subclasses override to maintain secondary indexes, revision
   * counters, audit logs, or to emit lifecycle events.
   *
   * @param _key - The newly-registered key.
   * @param _value - The newly-registered value.
   */
  protected onRegister(_key: TKey, _value: TValue): void {
    // No-op by default — subclasses override.
  }

  /**
   * Lifecycle hook invoked after every successful `remove`. Default
   * implementation is a no-op.
   *
   * Subclasses override to clean up secondary indexes, emit
   * lifecycle events, or release resources held by the value.
   *
   * @param _key - The removed key.
   * @param _value - The previous value at the removed key.
   */
  protected onRemove(_key: TKey, _value: TValue): void {
    // No-op by default — subclasses override.
  }

  // ══════════════════════════════════════════════════════════════════════════
  // Error-factory hooks (subclass-override points)
  // ══════════════════════════════════════════════════════════════════════════

  /**
   * Factory hook that produces the error thrown when `register` hits
   * a duplicate. Subclasses override to throw a domain-specific
   * subclass of {@link RegistryDuplicateError} so that:
   *
   *   - Tests can `expect(...).toThrow(DuplicateBlueprintError)`.
   *   - Callers can `catch` on the narrower type when needed.
   *   - Logs carry domain context (the entity / link / scene name).
   *
   * Default implementation returns a generic
   * {@link RegistryDuplicateError} carrying `this.constructor.name`.
   *
   * @param key - The duplicate key.
   * @returns The error to throw.
   */
  protected makeDuplicateError(key: TKey): Error {
    return new RegistryDuplicateError(key, this.constructor.name);
  }

  /**
   * Factory hook that produces the error thrown when `getOrFail`
   * misses. Subclasses override to throw a domain-specific subclass
   * of {@link RegistryMissingError} when more context is helpful in
   * stack traces and logs.
   *
   * Default implementation returns a generic
   * {@link RegistryMissingError} carrying `this.constructor.name`.
   *
   * @param key - The missing key.
   * @returns The error to throw.
   */
  protected makeMissingError(key: TKey): Error {
    return new RegistryMissingError(key, this.constructor.name);
  }
}
