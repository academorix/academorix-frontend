/**
 * @file config.service.ts
 * @module @stackra/config/core/services
 * @description Runtime `ConfigService` — the injectable class used
 *   to read + mutate configuration values after `ConfigModule.forRoot`
 *   has resolved.
 *
 *   Implements `IConfigService` from `@stackra/contracts` with:
 *   - 4 `get()` overloads (nestjs verbatim, minus the rxjs
 *     `changes$` observable which is deferred to v0.2).
 *   - 4 `getOrThrow()` overloads.
 *   - `set(path, value)` with Node-vs-browser process.env guard.
 *   - `describe(options?)` — **Stackra addition** — snapshot API for
 *     `/api/debug/config` endpoints.
 *
 * @derived @nestjs/config@4.0.4 — lib/config.service.ts (MIT, © Kamil Myśliwiec)
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import { Inject, Injectable, Optional } from "@stackra/container";
import type {
  IConfigDescribeEntry,
  IConfigDescribeOptions,
  IConfigGetOptions,
  IConfigService,
  NoInferType,
  Parser,
  Path,
  PathValue,
} from "@stackra/contracts";
import { CONFIGURATION_TOKEN } from "@stackra/contracts";

import { CONFIG_REDACTION_SENTINEL, VALIDATED_ENV_PROPNAME } from "../constants";
import { ConfigMissingKeyError } from "../errors";
import { getNestedValue, isNode, setNestedValue } from "../utils";

/**
 * Return-shape helper for the class-level `WasValidated` toggle.
 *
 * Family member of `ConfigService` — computed locally so consumers
 * don't need to import a helper type just to spell the overload
 * signatures. Package-internal.
 */
type _ValidatedResult<WasValidated extends boolean, T> = WasValidated extends true
  ? T
  : T | undefined;

/**
 * Set of legal keys for the `K` type parameter.
 *
 * Falls back to `string | symbol` when `K` has no known keys, so
 * untyped instances (`new ConfigService()` without generics) still
 * accept string paths. `keyof K` is intersected with `string | symbol`
 * so numeric index signatures on `K` don't leak `number` into the
 * accepted path union — the nested-value helpers accept
 * `string | symbol` only.
 */
type _KeyOf<K> = keyof K extends never ? string | symbol : keyof K & (string | symbol);

/**
 * Runtime configuration service — the sole injectable consumers use
 * to read + mutate resolved config values.
 *
 * Injects the internal configuration host record via
 * `CONFIGURATION_TOKEN` (from `@stackra/contracts`); `ConfigModule`
 * binds that token during `forRoot`. Marked `@Optional()` so
 * misconfigured tests that construct `ConfigService` bare still
 * boot with an empty record.
 *
 * @typeParam K - Class-level shape of the resolved config; drives
 *   the `{ infer: true }` overloads.
 * @typeParam WasValidated - Compile-time flag indicating whether the
 *   service was constructed with a validated schema. Controls the
 *   return-type nullability of `get`.
 *
 * @example
 * ```typescript
 * import { Injectable } from '@stackra/container';
 * import { ConfigService } from '@stackra/config';
 *
 * @Injectable()
 * export class MyService {
 *   public constructor(private readonly config: ConfigService) {}
 *
 *   public port(): number {
 *     return this.config.getOrThrow<number>('PORT');
 *   }
 * }
 * ```
 */
@Injectable()
export class ConfigService<
  K = Record<string | symbol, any>,
  WasValidated extends boolean = false,
> implements IConfigService<K, WasValidated> {
  // ── Private state ─────────────────────────────────────────────────

  /**
   * When `true`, `get` / `getOrThrow` skip the process.env fallback.
   *
   * `ConfigModule.forRoot({ skipProcessEnv: true })` sets this
   * through the `skipProcessEnv` setter below. Kept as a backing
   * field to match nestjs's getter/setter shape verbatim.
   */
  private _skipProcessEnv = false;

  /**
   * Env-file paths recorded by `ConfigModule.forRoot`. v0.1 stashes
   * them for v0.2's interpolation-rewrite feature. Exposed as a
   * getter (`envFilePaths`) so consumer tools can introspect what
   * was loaded.
   */
  private _envFilePaths: string[] = [];

  /**
   * Active parser recorded by `ConfigModule.forRoot`. Exposed as a
   * getter (`parser`) so consumer tools can introspect the resolved
   * parser (matches `_envFilePaths`).
   */
  private _parser: Parser | undefined;

  // ── Public API ────────────────────────────────────────────────────

  /**
   * Construct a ConfigService bound to a configuration host record.
   *
   * @param internalConfig - The shared configuration host record
   *   `ConfigModule` maintains. Marked `@Optional()` so a bare
   *   `new ConfigService()` in tests still constructs (returns
   *   `undefined` from every `get`).
   */
  public constructor(
    @Optional()
    @Inject(CONFIGURATION_TOKEN)
    private readonly internalConfig: Record<string, any> = {},
  ) {}

  /**
   * Read a configuration value by dotted property path.
   *
   * Overload 1 — bare lookup.
   */
  public get<T = any>(propertyPath: _KeyOf<K>): _ValidatedResult<WasValidated, T>;
  /**
   * Overload 2 — with `{ infer: true }` for type-narrowing.
   */
  public get<T = K, P extends Path<T> = any, R extends PathValue<T, P> = PathValue<T, P>>(
    propertyPath: P,
    options: IConfigGetOptions,
  ): _ValidatedResult<WasValidated, R>;
  /**
   * Overload 3 — with a fallback default (never `undefined`).
   */
  public get<T = any>(propertyPath: _KeyOf<K>, defaultValue: NoInferType<T>): T;
  /**
   * Overload 4 — default + `{ infer: true }`.
   */
  public get<T = K, P extends Path<T> = any, R extends PathValue<T, P> = PathValue<T, P>>(
    propertyPath: P,
    defaultValue: NoInferType<R>,
    options: IConfigGetOptions,
  ): Exclude<R, undefined>;
  public get<T = any>(
    propertyPath: _KeyOf<K>,
    defaultValueOrOptions?: T | IConfigGetOptions,
    options?: IConfigGetOptions,
  ): T | undefined {
    // ── Source 1: loaded namespaces ────────────────────────────────
    const internalValue = getNestedValue(this.internalConfig, propertyPath) as T | undefined;
    if (internalValue !== undefined) return internalValue;

    // ── Source 2: validated env slot ───────────────────────────────
    // Only present when the caller ran `ConfigModule.forRoot({ validate })`.
    // Skip the walk entirely when the slot doesn't exist.
    const validatedEnvValue = this.getFromValidatedEnv<T>(propertyPath);
    if (validatedEnvValue !== undefined) return validatedEnvValue;

    // Detect whether the trailing argument is the `{ infer: true }`
    // options marker (rather than a default value). When it is, we
    // must NOT treat it as a default fallback below.
    const defaultValue =
      this.isGetOptionsObject(defaultValueOrOptions as Record<string, any>) && !options
        ? undefined
        : (defaultValueOrOptions as T | undefined);

    // ── Source 3: process.env (Node only, gated) ───────────────────
    if (!this._skipProcessEnv) {
      const processEnvValue = this.getFromProcessEnv<T>(propertyPath);
      if (processEnvValue !== undefined) return processEnvValue;
    }

    return defaultValue;
  }

  /**
   * Read a configuration value or throw if unresolved.
   *
   * Overload 1 — bare lookup.
   */
  public getOrThrow<T = any>(propertyPath: _KeyOf<K>): Exclude<T, undefined>;
  /**
   * Overload 2 — with `{ infer: true }`.
   */
  public getOrThrow<T = K, P extends Path<T> = any, R extends PathValue<T, P> = PathValue<T, P>>(
    propertyPath: P,
    options: IConfigGetOptions,
  ): Exclude<R, undefined>;
  /**
   * Overload 3 — with a fallback default.
   */
  public getOrThrow<T = any>(
    propertyPath: _KeyOf<K>,
    defaultValue: NoInferType<T>,
  ): Exclude<T, undefined>;
  /**
   * Overload 4 — default + `{ infer: true }`.
   */
  public getOrThrow<T = K, P extends Path<T> = any, R extends PathValue<T, P> = PathValue<T, P>>(
    propertyPath: P,
    defaultValue: NoInferType<R>,
    options: IConfigGetOptions,
  ): Exclude<R, undefined>;
  public getOrThrow<T = any>(
    propertyPath: _KeyOf<K>,
    defaultValueOrOptions?: T | IConfigGetOptions,
    options?: IConfigGetOptions,
  ): Exclude<T, undefined> {
    // Delegate to `.get(...)` with the same trailing-argument shape so
    // both codepaths share resolution logic exactly. The `@ts-expect-error`
    // is unavoidable — we route through the internal implementation
    // signature, which is looser than any single overload.
    // @ts-expect-error — routing through the private impl signature
    const value = this.get(propertyPath, defaultValueOrOptions, options) as T | undefined;
    if (value === undefined) {
      throw new ConfigMissingKeyError(String(propertyPath));
    }
    return value as Exclude<T, undefined>;
  }

  /**
   * Sets a configuration value by dotted property path.
   *
   * Writes to the internal configuration host record unconditionally.
   * Under Node, also propagates the value into `process.env` (stringified)
   * so downstream `process.env`-reading consumers pick up the change.
   * In browser runtimes, `process.env` is untouched.
   *
   * @param propertyPath - Dotted path (or top-level key).
   * @param value - New value; converted to `string` when propagated
   *   to `process.env`.
   */
  public set<T = any>(propertyPath: _KeyOf<K>, value: T): void {
    setNestedValue(this.internalConfig, propertyPath, value);
    // Only write to process.env in Node — browsers don't have a
    // mutable environment record.
    if (isNode() && typeof propertyPath === "string") {
      process.env[propertyPath] = String(value);
    }
  }

  /**
   * Snapshot every resolved config path.
   *
   * **Stackra addition** — not in `@nestjs/config`. Walks the
   * internal host record and produces a flat entry per leaf path.
   * When `redactedKeys` is supplied, matching paths have their
   * `value` replaced with the redaction sentinel.
   *
   * @param options - Optional bag; `redactedKeys` matches property
   *   paths.
   * @returns Full snapshot keyed by property path.
   */
  public describe(options?: IConfigDescribeOptions): Record<string, IConfigDescribeEntry> {
    const out: Record<string, IConfigDescribeEntry> = {};

    // Local flatten — walks nested objects and produces one entry
    // per leaf. Kept as a closure (rather than a private method) so
    // it can share `out` + `options` without instance-state
    // gymnastics.
    const flatten = (
      obj: unknown,
      prefix: string,
      source: IConfigDescribeEntry["source"],
    ): void => {
      // Base case — non-object leaf.
      if (obj === null || obj === undefined || typeof obj !== "object") {
        const shouldRedact =
          prefix.length > 0 && (options?.redactedKeys?.some((rx) => rx.test(prefix)) ?? false);
        out[prefix] = {
          value: shouldRedact ? CONFIG_REDACTION_SENTINEL : obj,
          source,
          // v0.1 always reports `false` — a full provenance tracker is
          // deferred to v0.2 alongside `changes$`. See PLAN.md §3.3.
          isDefault: false,
          path: prefix,
        };
        return;
      }
      // Recurse for own enumerable properties. Skip the validated-env
      // slot (`VALIDATED_ENV_PROPNAME`) — it's walked separately with
      // `source: 'validated'` below.
      for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
        if (prefix.length === 0 && key === VALIDATED_ENV_PROPNAME) continue;
        flatten(value, prefix.length > 0 ? `${prefix}.${key}` : key, source);
      }
    };

    flatten(this.internalConfig, "", "load");
    // The validated-env slot is a separate source — walked after the
    // main tree so its entries clearly attribute back to `'validated'`.
    const validatedSlot = this.internalConfig[VALIDATED_ENV_PROPNAME];
    if (validatedSlot !== undefined && validatedSlot !== null) {
      flatten(validatedSlot, "", "validated");
    }
    return out;
  }

  // ── Package-internal setters (called by `ConfigModule`) ──────────

  /**
   * Package-internal — called by `ConfigModule.forRoot` to record
   * the resolved env-file paths. Consumers should not call this.
   *
   * @param paths - Absolute paths that were loaded.
   */
  public setEnvFilePaths(paths: string[]): void {
    this._envFilePaths = paths;
  }

  /**
   * Read-only view of the env-file paths recorded during
   * `ConfigModule.forRoot`. Empty in browser runtimes.
   */
  public get envFilePaths(): readonly string[] {
    return this._envFilePaths;
  }

  /**
   * Package-internal — called by `ConfigModule.forRoot` to set the
   * active parser (used by v0.2's interpolation rewrite).
   *
   * @param parser - Parser matching the `@stackra/contracts` shape.
   */
  public setParser(parser: Parser): void {
    this._parser = parser;
  }

  /**
   * Read-only view of the parser recorded during
   * `ConfigModule.forRoot`. `undefined` in browser runtimes.
   */
  public get parser(): Parser | undefined {
    return this._parser;
  }

  /**
   * Package-internal — called by `ConfigModule.forRoot` to opt out
   * of the process.env fallback branch (`skipProcessEnv: true`).
   *
   * @param value - `true` to disable process.env reads.
   */
  public set skipProcessEnv(value: boolean) {
    this._skipProcessEnv = value;
  }

  // ── Private ───────────────────────────────────────────────────────

  /**
   * Read from the validated-env slot on the internal host record.
   *
   * Package-internal — only called by `get`. Returns `undefined`
   * when the slot doesn't exist (no `validate` / `validationSchema`
   * was configured).
   */
  private getFromValidatedEnv<T>(propertyPath: _KeyOf<K>): T | undefined {
    const slot = this.internalConfig[VALIDATED_ENV_PROPNAME] as Record<string, unknown> | undefined;
    if (!slot) return undefined;
    return getNestedValue(slot, propertyPath) as T | undefined;
  }

  /**
   * Read from `process.env` (Node only).
   *
   * Package-internal — only called by `get`. Returns `undefined` in
   * browser runtimes so the browser bundle stays clean.
   */
  private getFromProcessEnv<T>(propertyPath: _KeyOf<K>): T | undefined {
    // The isNode() short-circuit lets bundlers eliminate the
    // reference to `process.env` in browser builds.
    if (!isNode()) return undefined;
    if (typeof propertyPath !== "string") return undefined;
    return getNestedValue(process.env, propertyPath) as T | undefined;
  }

  /**
   * Discriminate an `{ infer: true }` marker from a plain default
   * value. Both are passed positionally so we shape-match at runtime.
   *
   * The return type is a plain `boolean` rather than a
   * `options is IConfigGetOptions` type-predicate — the caller's
   * argument is typed as an arbitrary record, and TypeScript rejects
   * a narrower predicate whose target type is more specific than
   * the parameter (`IConfigGetOptions.infer` is `true`, not
   * `unknown`).
   */
  private isGetOptionsObject(options: Record<string, unknown> | undefined): boolean {
    return (
      options !== null &&
      options !== undefined &&
      typeof options === "object" &&
      // `infer` must be a literal `true` marker; every real default
      // that happened to be an object still needs a broader shape,
      // and the length===1 check guards against ambiguous overlaps
      // (e.g. `{ infer: true, ...cfg }` — a genuine object).
      (options as { infer?: unknown }).infer === true &&
      Object.keys(options).length === 1
    );
  }
}
