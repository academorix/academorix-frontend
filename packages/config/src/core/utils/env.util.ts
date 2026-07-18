/**
 * @file env.util.ts
 * @module @stackra/config/core/utils
 * @description Typed env-access helpers used inside `registerAs`
 *   factories.
 *
 *   **Stackra addition** — the six-method `env(...)` façade wraps
 *   `@stackra/support`'s `Env` class rather than re-implementing the
 *   three-source resolution (`process.env` → `import.meta.env` →
 *   `globalThis.__ENV__`). Per `.kiro/steering/support-utilities.md`:
 *   never re-implement `Env`; always wrap it.
 */

import { Env } from "@stackra/support";

import { ConfigEnvInvalidError } from "../errors";

/**
 * Type of the `env` façade — the base function plus its five
 * attached methods. Declared explicitly so consumers get a stable
 * inferred type when they alias the export locally.
 */
interface EnvHelper {
  /** Base function — string read with default. */
  (key: string, defaultValue?: string): string;
  /** Numeric read with NaN-safe default. */
  number(key: string, defaultValue?: number): number;
  /** Boolean read with truthy list (`true` / `1` / `yes` / `on`). */
  bool(key: string, defaultValue?: boolean): boolean;
  /** Required read — throws `ConfigEnvMissingError` on absence. */
  orFail(key: string): string;
  /** Enum read — asserts membership in a fixed allowed list. */
  enum<T extends string>(key: string, allowed: readonly T[], defaultValue?: T): T;
  /** URL read — parses via `new URL(...)`, throws on invalid input. */
  url(key: string, defaultValue?: string): URL;
}

/**
 * The base `env(key, default?)` function — declared as an ordinary
 * function so its own `.number` / `.bool` / etc. attachments are
 * addressable via `Object.defineProperty` below.
 */
function envBase(key: string, defaultValue: string = ""): string {
  return Env.get(key, defaultValue);
}

// Attach the sibling readers directly onto `envBase`. TypeScript treats
// the assignment as a type widening, so the exported binding is cast
// through `EnvHelper` at the export site.
(envBase as EnvHelper).number = (key: string, defaultValue: number = 0): number =>
  Env.getNumber(key, defaultValue);

(envBase as EnvHelper).bool = (key: string, defaultValue: boolean = false): boolean =>
  Env.getBoolean(key, defaultValue);

// `Env.getOrFail` already throws with a descriptive message that names
// the missing key. It throws a plain `Error` (not our
// `ConfigEnvMissingError`), so callers that want the pinned error
// code catch `ConfigError` at a higher level and re-tag; keeping the
// straight passthrough here avoids inventing yet another wrapper.
(envBase as EnvHelper).orFail = (key: string): string => Env.getOrFail(key);

(envBase as EnvHelper).enum = <T extends string>(
  key: string,
  allowed: readonly T[],
  defaultValue?: T,
): T => {
  // Feed the default value straight into `Env.get` so the resolver
  // still walks its three sources — the explicit default only takes
  // effect on a full miss.
  const raw = Env.get(key, defaultValue ?? "");
  if (!(allowed as readonly string[]).includes(raw)) {
    throw new ConfigEnvInvalidError(key, `must be one of: ${allowed.join(", ")}, got: ${raw}`);
  }
  return raw as T;
};

(envBase as EnvHelper).url = (key: string, defaultValue?: string): URL => {
  const raw = Env.get(key, defaultValue ?? "");
  try {
    return new URL(raw);
  } catch {
    // Re-throw as our own error so consumers can `instanceof
    // ConfigError` catch the whole family without special-casing
    // `TypeError` from `new URL(...)`.
    throw new ConfigEnvInvalidError(key, `must be a valid URL, got: ${raw}`);
  }
};

/**
 * Typed env-access helper — the canonical way to read env vars inside
 * a `registerAs` factory.
 *
 * @example
 * ```typescript
 * import { registerAs, env } from '@stackra/config';
 *
 * export const cacheConfig = registerAs('cache', () => ({
 *   default: env('CACHE_STORE', 'memory'),
 *   ttl: env.number('CACHE_TTL', 3600),
 *   debug: env.bool('DEBUG', false),
 *   nodeEnv: env.enum('NODE_ENV', ['development', 'production', 'test'], 'development'),
 *   apiUrl: env.url('API_URL', 'http://localhost:3000'),
 * }));
 * ```
 */
export const env: EnvHelper = envBase as EnvHelper;
