/**
 * @file path.type.ts
 * @module @stackra/contracts/types/config
 * @description Dotted-path type used by `ConfigService.get('a.b.c', { infer: true })`
 *   to statically infer legal property paths from a config shape.
 *
 *   The final export is `Path<T>`; the file also carries the recursive
 *   support types (`_ConfigPathIsAny`, `_ConfigPathImpl`, `_ConfigPathImpl2`)
 *   as a **composite family**: they exist ONLY to compute `Path<T>` and
 *   have no independent semantics. Family grouping per
 *   `.kiro/steering/code-standards.md`.
 *
 * @derived @nestjs/config@4.0.4 — lib/types/path-value.type.ts (MIT, © Kamil Myśliwiec)
 */

/**
 * Detects whether `T` is `any`.
 *
 * Support type for `_ConfigPathImpl` — narrowing an `any` property
 * would inflate the union to every possible string, so the recursion
 * stops there. Exported as a family member of `Path<T>` (its only
 * consumer) and re-exported from the barrel for consumers who need
 * the same discrimination in their own recursive types.
 *
 * Source: https://stackoverflow.com/a/68633327/5290447
 */
export type _ConfigPathIsAny<T> = unknown extends T
  ? [keyof T] extends [never]
    ? false
    : true
  : false;

/**
 * Per-key recursive descent that produces every legal dotted path from
 * a single key of `T`. Support type for `_ConfigPathImpl2` — the shape
 * mirrors the upstream implementation verbatim.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type _ConfigPathImpl<T, Key extends keyof T> = Key extends string
  ? _ConfigPathIsAny<T[Key]> extends true
    ? never
    : T[Key] extends Record<string, any>
      ? | `${Key}.${_ConfigPathImpl<T[Key], Exclude<keyof T[Key], keyof any[]>> & string}`
        | `${Key}.${Exclude<keyof T[Key], keyof any[]> & string}`
      : never
  : never;

/**
 * Union of every legal dotted path from every key of `T` PLUS the raw
 * top-level keys of `T`. Direct input to the public `Path<T>` alias.
 */
export type _ConfigPathImpl2<T> = _ConfigPathImpl<T, keyof T> | keyof T;

/**
 * Statically-inferred union of every legal dotted property path from
 * a config shape `T`.
 *
 * Powers the `{ infer: true }` overloads of `ConfigService.get` /
 * `ConfigService.getOrThrow`, so that `configService.get('a.b.c', ...)`
 * autocompletes and rejects unknown paths at compile time.
 *
 * @typeParam T - The config shape to enumerate paths from.
 * @publicApi
 *
 * @example
 * ```typescript
 * type Cfg = { database: { host: string; port: number } };
 * type P = Path<Cfg>;
 * //   ^ = 'database' | 'database.host' | 'database.port'
 * ```
 */
export type Path<T> = keyof T extends string
  ? _ConfigPathImpl2<T> extends infer P
    ? P extends string | keyof T
      ? P
      : keyof T
    : keyof T
  : never;
