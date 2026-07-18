/**
 * @file no-infer-type.type.ts
 * @module @stackra/contracts/types/config
 * @description Utility type that suppresses type-parameter inference
 *   from a default-value argument in `ConfigService.get` overloads.
 *
 * @derived @nestjs/config@4.0.4 — lib/types/no-infer.type.ts (MIT, © Kamil Myśliwiec)
 */

/**
 * Suppresses inference from the position in which it appears.
 *
 * When used on a default-value parameter (`defaultValue: NoInferType<T>`),
 * TypeScript is prevented from inferring `T` from the default value —
 * the caller must supply `T` from the property-path argument or the
 * explicit generic parameter. This preserves the intent of
 * `ConfigService.get<T>(path, defaultValue)` where `T` should come
 * from the key, not the fallback.
 *
 * @typeParam T - The type whose inference is being suppressed.
 * @publicApi
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type NoInferType<T> = [T][T extends any ? 0 : never];
