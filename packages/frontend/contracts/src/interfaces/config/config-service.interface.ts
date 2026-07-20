/**
 * @file config-service.interface.ts
 * @module @stackra/contracts/interfaces/config
 * @description Public contract of `@stackra/config`'s `ConfigService`
 *   — the runtime service used to read and mutate configuration values
 *   after `ConfigModule.forRoot` has resolved.
 *
 *   The four `get` / `getOrThrow` overloads mirror `@nestjs/config`
 *   verbatim. Two support types (`_ConfigKeyOf`, `_ConfigValidatedResult`)
 *   live in this file as a **composite family** — they exist only to
 *   compute the return types of the interface's methods.
 *
 *   `describe(options?)` is a **Stackra addition** — a snapshot API for
 *   `/api/debug/config` endpoints in dev builds.
 *
 * @derived @nestjs/config@4.0.4 — lib/config.service.ts (MIT, © Kamil Myśliwiec)
 */

import type { NoInferType } from "@/types/config/no-infer-type.type";
import type { Path } from "@/types/config/path.type";
import type { PathValue } from "@/types/config/path-value.type";
import type { IConfigGetOptions } from "./config-get-options.interface";

/**
 * Set of legal keys for the `K` type parameter of `IConfigService`.
 *
 * When `K` has no known keys (the default `Record<string | symbol, unknown>`
 * case), falls back to `string | symbol` so untyped consumers still
 * work. Family member of `IConfigService` — grouped in this file per
 * `.kiro/steering/code-standards.md` composite-family rule.
 */
export type _ConfigKeyOf<T> = keyof T extends never ? string | symbol : keyof T;

/**
 * Return-shape helper for `get` / `getOrThrow` overloads.
 *
 * When the `ConfigService` was initialised with a validated schema
 * (`WasValidated = true`), reads are guaranteed non-undefined; without
 * validation the return may be `undefined`. Family member of
 * `IConfigService`.
 */
export type _ConfigValidatedResult<WasValidated extends boolean, T> = WasValidated extends true
  ? T
  : T | undefined;

/**
 * Snapshot entry produced by `IConfigService.describe`.
 *
 * One entry per resolved property path — the runtime records where a
 * value came from (a loaded factory, validated env, process.env, or
 * the fallback default) so `/api/debug/config` endpoints can audit
 * config resolution without touching the runtime state.
 */
export interface IConfigDescribeEntry {
  /** Resolved value; redacted to `'***REDACTED***'` when the key matches a `redactedKeys` pattern. */
  value: unknown;
  /** Where the value came from. */
  source: "load" | "env" | "validated" | "process";
  /** `true` when the value fell through to a factory-supplied default. */
  isDefault: boolean;
  /** Dotted property path this entry describes. */
  path: string;
}

/**
 * Options for `IConfigService.describe`.
 */
export interface IConfigDescribeOptions {
  /**
   * Regex patterns matched against the property path (case-sensitive).
   * Any matching entry's `value` is replaced with the redaction
   * sentinel; the `source` / `isDefault` / `path` fields are
   * unaffected.
   */
  redactedKeys?: RegExp[];
}

/**
 * Public contract of `@stackra/config`'s `ConfigService`.
 *
 * Consumers inject `ConfigService` (the class) or `IConfigService`
 * (via the `CONFIGURATION_SERVICE_TOKEN` alias) and read configuration
 * values through the `get` / `getOrThrow` overloads.
 *
 * The four overload variants correspond to:
 *
 * 1. `get(path)` — bare lookup, may return `undefined`.
 * 2. `get(path, options)` — with `{ infer: true }`, narrows the return
 *    type via `Path<K>` + `PathValue<K, P>`.
 * 3. `get(path, defaultValue)` — with a fallback; never `undefined`.
 * 4. `get(path, defaultValue, options)` — combines both.
 *
 * `getOrThrow` mirrors the same four shapes but throws when the value
 * is `undefined` after every source is checked.
 *
 * @typeParam K - Class-level shape of the merged config; enables the
 *   type-inferring `{ infer: true }` overloads.
 * @typeParam WasValidated - Compile-time flag indicating whether the
 *   ConfigService was constructed with a validated schema. When `true`,
 *   `get` returns `T`; when `false`, `T | undefined`.
 * @publicApi
 *
 * @example
 * ```typescript
 * import { Inject } from '@stackra/container';
 * import { CONFIGURATION_SERVICE_TOKEN, type IConfigService } from '@stackra/contracts';
 *
 * class MyService {
 *   public constructor(
 *     @Inject(CONFIGURATION_SERVICE_TOKEN) private readonly config: IConfigService,
 *   ) {}
 *
 *   public port(): number {
 *     return this.config.getOrThrow<number>('PORT');
 *   }
 * }
 * ```
 */
export interface IConfigService<
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  K = Record<string | symbol, any>,
  WasValidated extends boolean = false,
> {
  // ── get() — 4 overloads ──────────────────────────────────────────

  /**
   * Get a configuration value by dotted property path.
   *
   * @param propertyPath - Property path (dot notation supported).
   * @returns The resolved value or `undefined` when unknown.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  get<T = any>(propertyPath: _ConfigKeyOf<K>): _ConfigValidatedResult<WasValidated, T>;

  /**
   * Get a configuration value with `{ infer: true }` type narrowing.
   *
   * @param propertyPath - Property path (constrained to `Path<T>`).
   * @param options - Marker `{ infer: true }` activating narrowing.
   * @returns The resolved value narrowed to `PathValue<T, P>`.
   */
  get<
    T = K,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    P extends Path<T> = any,
    R extends PathValue<T, P> = PathValue<T, P>,
  >(
    propertyPath: P,
    options: IConfigGetOptions,
  ): _ConfigValidatedResult<WasValidated, R>;

  /**
   * Get a configuration value with a fallback default.
   *
   * The default value is returned when every source
   * (load → validated env → process.env) misses.
   *
   * @param propertyPath - Property path (dot notation supported).
   * @param defaultValue - Fallback returned when the path is unset.
   * @returns The resolved value or the default (never `undefined`).
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  get<T = any>(propertyPath: _ConfigKeyOf<K>, defaultValue: NoInferType<T>): T;

  /**
   * Get a configuration value with a default AND `{ infer: true }`.
   *
   * @param propertyPath - Property path (constrained to `Path<T>`).
   * @param defaultValue - Fallback returned when the path is unset.
   * @param options - Marker `{ infer: true }` activating narrowing.
   * @returns The resolved / default value, narrowed to `PathValue<T, P>`.
   */
  get<
    T = K,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    P extends Path<T> = any,
    R extends PathValue<T, P> = PathValue<T, P>,
  >(
    propertyPath: P,
    defaultValue: NoInferType<R>,
    options: IConfigGetOptions,
  ): Exclude<R, undefined>;

  // ── getOrThrow() — 4 overloads ────────────────────────────────────

  /**
   * Get a configuration value or throw if unknown.
   *
   * @param propertyPath - Property path (dot notation supported).
   * @returns The resolved value, guaranteed non-undefined.
   * @throws {TypeError} When the path is not resolvable from any source.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getOrThrow<T = any>(propertyPath: _ConfigKeyOf<K>): Exclude<T, undefined>;

  /**
   * Get a configuration value or throw, with `{ infer: true }`.
   *
   * @param propertyPath - Property path (constrained to `Path<T>`).
   * @param options - Marker `{ infer: true }` activating narrowing.
   * @returns The resolved value, narrowed to `PathValue<T, P>` and
   *   guaranteed non-undefined.
   * @throws {TypeError} When the path is not resolvable from any source.
   */
  getOrThrow<
    T = K,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    P extends Path<T> = any,
    R extends PathValue<T, P> = PathValue<T, P>,
  >(
    propertyPath: P,
    options: IConfigGetOptions,
  ): Exclude<R, undefined>;

  /**
   * Get a configuration value or throw, with a fallback default.
   *
   * Throws only when both the resolved value AND the default are
   * `undefined`.
   *
   * @param propertyPath - Property path (dot notation supported).
   * @param defaultValue - Fallback returned when the path is unset.
   * @returns The resolved / default value, guaranteed non-undefined.
   * @throws {TypeError} When both value and default are `undefined`.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getOrThrow<T = any>(
    propertyPath: _ConfigKeyOf<K>,
    defaultValue: NoInferType<T>,
  ): Exclude<T, undefined>;

  /**
   * Get a configuration value or throw, with default + `{ infer: true }`.
   *
   * @param propertyPath - Property path (constrained to `Path<T>`).
   * @param defaultValue - Fallback returned when the path is unset.
   * @param options - Marker `{ infer: true }` activating narrowing.
   * @returns The resolved / default value, narrowed and non-undefined.
   * @throws {TypeError} When both value and default are `undefined`.
   */
  getOrThrow<
    T = K,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    P extends Path<T> = any,
    R extends PathValue<T, P> = PathValue<T, P>,
  >(
    propertyPath: P,
    defaultValue: NoInferType<R>,
    options: IConfigGetOptions,
  ): Exclude<R, undefined>;

  // ── mutation ──────────────────────────────────────────────────────

  /**
   * Sets a configuration value by dotted property path.
   *
   * Writes to the internal configuration host record. In Node
   * runtimes, also writes to `process.env` (stringified) so downstream
   * `process.env`-reading consumers pick up the change. In browser
   * runtimes, `process.env` is untouched.
   *
   * @param propertyPath - Property path (dot notation supported).
   * @param value - New value to write. Serialised to `string` when
   *   propagated to `process.env`.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  set<T = any>(propertyPath: _ConfigKeyOf<K>, value: T): void;

  // ── introspection (Stackra addition) ─────────────────────────────

  /**
   * Snapshot every resolved config path.
   *
   * **Stackra addition** — not in `@nestjs/config`. Returns a flat
   * record keyed by dotted property path, with value + source
   * provenance + default-flag on each entry. Powers `/api/debug/config`
   * endpoints in dev builds.
   *
   * @param options - Optional bag; `redactedKeys` matches property
   *   paths and replaces their values with a redaction sentinel.
   * @returns Full snapshot keyed by property path.
   *
   * @example
   * ```typescript
   * const snapshot = config.describe({
   *   redactedKeys: [/_SECRET$/, /_KEY$/, /_TOKEN$/],
   * });
   * ```
   */
  describe(options?: IConfigDescribeOptions): Record<string, IConfigDescribeEntry>;
}
