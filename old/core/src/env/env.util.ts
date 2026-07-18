/**
 * @file env.util.ts
 * @module @academorix/core/env/env.util
 *
 * @description
 * Type-safe environment variable reader that works across every runtime
 * we ship in the workspace (Vite dev/build via `import.meta.env`, Next.js
 * server + build via `process.env`, Node scripts via `process.env`).
 *
 * The runtime detection is done once at module load. Consumers don't need
 * to think about which environment they're in — they just call
 * `env(key, defaultValue, schema?)` and get a typed, validated value.
 *
 * ## Contract
 *
 *  - The key MUST be prefixed with `VITE_`, `NEXT_PUBLIC_`, or `PUBLIC_`
 *    to be readable in a browser build (build tools strip everything else).
 *  - When called WITHOUT a schema, the return type is inferred from
 *    `defaultValue`:
 *      - `string` → returns the raw string when present.
 *      - `number` → coerces via `Number(raw)`; falls back on `NaN`.
 *      - `boolean` → accepts `"true"`, `"1"`, `"yes"`, `"on"` case-insensitively.
 *  - When called WITH a Zod schema, the raw value (or the default if the
 *    var is absent) is passed through `safeParse` and any validation
 *    failure throws — the intended behaviour for boot-time verification.
 *
 * ## Rationale
 *
 * Every app in the workspace was reimplementing the same pattern: read
 * a raw env, coerce it, validate it, throw on failure. Extracting the
 * primitive into `@academorix/core` means:
 *
 *  - Dashboard reads Vite env — same helper.
 *  - Landing-page reads Next.js env — same helper.
 *  - A future admin surface reads whatever it wants — same helper.
 *
 * @example Basic usage
 * ```ts
 * import { env } from "@academorix/core/env";
 *
 * const port = env("VITE_PORT", 3000);           // number (auto-coerce)
 * const host = env("VITE_HOST", "localhost");    // string
 * const debug = env("VITE_DEBUG", false);        // boolean
 * ```
 *
 * @example Schema-validated
 * ```ts
 * import { env } from "@academorix/core/env";
 * import { z } from "zod";
 *
 * const tier = env(
 *   "VITE_APP_ENV",
 *   "local" as const,
 *   z.enum(["local", "staging", "production"]),
 * );
 * ```
 */

import { z } from "zod";

/** Values a build tool sometimes surfaces for a missing env var. */
const EMPTY_STRING_VALUES = new Set(["", "undefined", "null"]);

/**
 * Reads a single env var from whatever runtime is available.
 *
 * Priority order:
 *  1. `import.meta.env[key]` if `import.meta` exists (Vite / Astro / SvelteKit).
 *  2. `process.env[key]` if `process` exists (Node / Next.js / SSR).
 *  3. `undefined` otherwise (browser without `import.meta.env`).
 *
 * The lookup is per-call so hot-reloading rebuilds see the latest values.
 * Returns `undefined` for empty strings and literal `"undefined"` /
 * `"null"` so callers can uniformly fall back to defaults.
 */
function readRawEnv(key: string): string | undefined {
  let raw: unknown;

  // 1. Vite / Astro / SvelteKit — `import.meta.env`.
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const meta = (globalThis as any).import?.meta as { env?: Record<string, unknown> } | undefined;

    if (meta?.env) {
      raw = meta.env[key];
    }
  } catch {
    // Access to import.meta from a non-ESM context throws — ignore.
  }

  // Fallback for bundlers that transform `import.meta.env` at build time:
  // the transformed reference lives on the module scope, not globalThis.
  // We can't reach it from here — apps that want Vite env should wrap
  // this util with a call site inside their own build unit.

  // 2. Node / Next.js / SSR — `process.env`.
  //
  // Use `globalThis.process` with an explicit narrowing cast so
  // downstream packages that transitively depend on this module DO NOT
  // need `@types/node` in their tsconfig — the type is resolved locally.
  if (raw === undefined) {
    const nodeProcess = (globalThis as { process?: { env?: Record<string, string | undefined> } })
      .process;

    if (nodeProcess?.env) {
      raw = nodeProcess.env[key];
    }
  }

  if (raw === undefined || raw === null) {
    return undefined;
  }

  const str = String(raw);

  return EMPTY_STRING_VALUES.has(str) ? undefined : str;
}

/**
 * Generic, type-safe environment variable reader.
 *
 * @typeParam T - Inferred from `defaultValue` when no schema is given;
 *   inferred from `schema` otherwise.
 * @param key - The env var name (must be a public prefix per build tool).
 * @param defaultValue - Fallback returned when the var is absent or empty.
 * @param schema - Optional Zod schema for structural validation.
 * @returns The parsed value.
 * @throws Error when the value fails schema validation.
 */
export function env<T>(key: string, defaultValue: T, schema?: z.ZodType<T>): T {
  const raw = readRawEnv(key);

  if (schema) {
    const candidate: unknown = raw ?? defaultValue;
    const parsed = schema.safeParse(candidate);

    if (parsed.success) {
      return parsed.data;
    }

    // eslint-disable-next-line no-console
    console.error(
      `[@academorix/core] Invalid value for env var "${key}": ${JSON.stringify(candidate)}\n` +
        z.prettifyError(parsed.error),
    );
    throw new Error(`Invalid environment variable "${key}".`);
  }

  if (raw === undefined) {
    return defaultValue;
  }

  // Auto-coerce based on the shape of the default value.
  switch (typeof defaultValue) {
    case "number": {
      const parsed = Number(raw);

      return (Number.isFinite(parsed) ? parsed : defaultValue) as T;
    }
    case "boolean": {
      return ["true", "1", "yes", "on"].includes(raw.toLowerCase()) as unknown as T;
    }
    default:
      return raw as T;
  }
}

/**
 * Provider-neutral env reader. Given a `read` function (usually a
 * closure over `import.meta.env` in the caller's build unit so Vite can
 * inline the values at build time), returns an `env(key, default,
 * schema?)` helper with identical semantics to {@link env}.
 *
 * Vite replaces `import.meta.env.FOO` at BUILD TIME via a text
 * substitution — that substitution only happens inside the caller's
 * compilation unit, not inside `@academorix/core`. Wrap this in each app:
 *
 * @example
 * ```ts
 * // apps/dashboard/src/config/env.config.ts
 * import { createEnvReader } from "@academorix/core/env";
 *
 * export const env = createEnvReader((key) =>
 *   (import.meta.env as Record<string, unknown>)[key],
 * );
 * ```
 */
export function createEnvReader(
  read: (key: string) => unknown,
): <T>(key: string, defaultValue: T, schema?: z.ZodType<T>) => T {
  return <T>(key: string, defaultValue: T, schema?: z.ZodType<T>): T => {
    const rawValue = read(key);
    const raw =
      rawValue === undefined || rawValue === null
        ? undefined
        : EMPTY_STRING_VALUES.has(String(rawValue))
          ? undefined
          : String(rawValue);

    if (schema) {
      const candidate: unknown = raw ?? defaultValue;
      const parsed = schema.safeParse(candidate);

      if (parsed.success) {
        return parsed.data;
      }

      // eslint-disable-next-line no-console
      console.error(
        `[@academorix/core] Invalid value for env var "${key}": ${JSON.stringify(candidate)}\n` +
          z.prettifyError(parsed.error),
      );
      throw new Error(`Invalid environment variable "${key}".`);
    }

    if (raw === undefined) {
      return defaultValue;
    }

    switch (typeof defaultValue) {
      case "number": {
        const parsed = Number(raw);

        return (Number.isFinite(parsed) ? parsed : defaultValue) as T;
      }
      case "boolean": {
        return ["true", "1", "yes", "on"].includes(raw.toLowerCase()) as unknown as T;
      }
      default:
        return raw as T;
    }
  };
}
