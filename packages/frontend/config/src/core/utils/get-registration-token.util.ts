/**
 * @file get-registration-token.util.ts
 * @module @stackra/config/core/utils
 * @description Reads back the namespace token stamped onto a config
 *   factory by `registerAs`.
 *
 *   Package-internal — used by `ConfigModule` to identify which
 *   partial config a `useFactory` provider originated from, so the
 *   merge step (`mergeConfigObject`) can write into the correct
 *   namespace slot on the internal host record.
 *
 * @derived @nestjs/config@4.0.4 — lib/utils/get-registration-token.util.ts (MIT, © Kamil Myśliwiec)
 */

import { PARTIAL_CONFIGURATION_KEY } from "../constants";

/**
 * Read the namespace token off a config factory function.
 *
 * The token was stamped by `registerAs` via `Object.defineProperty`
 * against the `PARTIAL_CONFIGURATION_KEY` symbol. Returns `undefined`
 * when the passed value did NOT come from `registerAs`, so callers
 * can fail-soft on stray factory shapes.
 *
 * @param config - Object to inspect (typically a factory function).
 * @returns The namespace token (`string | symbol`) stamped by
 *   `registerAs`, or `undefined` when the object was not registered.
 */
export function getRegistrationToken(config: unknown): string | symbol | undefined {
  if (config === null || config === undefined) return undefined;
  if (typeof config !== "function" && typeof config !== "object") return undefined;
  // Symbol-keyed access — the property is non-enumerable but still
  // reachable via direct indexing.
  const token = (config as Record<symbol, string | symbol | undefined>)[PARTIAL_CONFIGURATION_KEY];
  return token;
}
