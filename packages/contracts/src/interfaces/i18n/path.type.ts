/**
 * @file path.type.ts
 * @module @stackra/contracts/interfaces/i18n
 * @description Recursive template-literal types used to derive type-safe
 *   translation-key paths from a translations shape. Powers IDE
 *   autocompletion on `t()` and compile-time key validation.
 *
 *   Lives in contracts so cross-package consumers can type generic
 *   translations against a single source of truth.
 *
 *   Renamed from the ambiguous `Path` / `PathValue` names to the
 *   translation-scoped `TranslationPath` / `TranslationPathValue` so
 *   the generic `Path<T>` / `PathValue<T, P>` under `types/config` can
 *   own the top-level barrel names (mirrors `@nestjs/config`).
 */

/**
 * Returns the fallback type `Y` when `T` is `any` or `never`, and `N`
 * otherwise. Small helper used by the generated `TranslationPath` type
 * so a `unknown`-typed translations shape degrades gracefully to a
 * plain `string`.
 */
export type IfAnyOrNever<T, Y, N> = 0 extends 1 & T ? Y : [T] extends [never] ? Y : N;

/**
 * Recursively generates every valid dot-separated key path for a
 * translations shape.
 *
 * @typeParam T - The translations object shape.
 * @typeParam Prefix - Internal accumulator — do not pass explicitly.
 *
 * @example
 * ```typescript
 * type Translations = { auth: { login: { title: string; submit: string } } };
 * type Keys = TranslationPath<Translations>;
 * //   ^? "auth" | "auth.login" | "auth.login.title" | "auth.login.submit"
 * ```
 */
export type TranslationPath<T, Prefix extends string = ""> =
  T extends Record<string, unknown>
    ? {
        [K in keyof T & string]: T[K] extends Record<string, unknown>
          ? `${Prefix}${K}` | TranslationPath<T[K], `${Prefix}${K}.`>
          : `${Prefix}${K}`;
      }[keyof T & string]
    : never;

/**
 * Resolves the value type at a given dot-separated path in a
 * translations shape.
 *
 * @typeParam T - The translations object type.
 * @typeParam P - The dot-separated path string.
 *
 * @example
 * ```typescript
 * type Translations = { auth: { login: { title: string } } };
 * type Value = TranslationPathValue<Translations, "auth.login.title">; // string
 * ```
 */
export type TranslationPathValue<T, P extends string> = P extends `${infer K}.${infer Rest}`
  ? K extends keyof T
    ? TranslationPathValue<T[K], Rest>
    : never
  : P extends keyof T
    ? T[P]
    : never;
