/**
 * @file path-value.type.ts
 * @module @stackra/contracts/types/config
 * @description Companion type to `Path<T>` — resolves the value type
 *   at a legal dotted property path of a config shape.
 *
 * @derived @nestjs/config@4.0.4 — lib/types/path-value.type.ts (MIT, © Kamil Myśliwiec)
 */

import type { Path } from "./path.type";

/**
 * Resolves the value type at property path `P` of config shape `T`.
 *
 * Complements `Path<T>` — where `Path<T>` produces the legal path
 * union, `PathValue<T, P>` produces the corresponding value type at
 * a specific path. Powers the `R` type-parameter defaulting of
 * `ConfigService.get<T, P, R>` overloads.
 *
 * @typeParam T - The config shape to walk.
 * @typeParam P - A legal dotted path from `Path<T>`.
 * @publicApi
 *
 * @example
 * ```typescript
 * type Cfg = { database: { host: string; port: number } };
 * type Host = PathValue<Cfg, 'database.host'>;
 * //   ^ = string
 * type DbPort = PathValue<Cfg, 'database.port'>;
 * //   ^ = number
 * ```
 */
export type PathValue<T, P extends Path<T>> = P extends `${infer Key}.${infer Rest}`
  ? Key extends keyof T
    ? Rest extends Path<T[Key]>
      ? PathValue<T[Key], Rest>
      : never
    : never
  : P extends keyof T
    ? T[P]
    : never;
