/**
 * @file merge-config-object.util.ts
 * @module @stackra/config/core/utils
 * @description Package-internal merge helper — writes a partial
 *   config into the internal host record under a namespace slot,
 *   or shallow-assigns when no namespace is provided.
 *
 * @derived @nestjs/config@4.0.4 — lib/utils/merge-configs.util.ts (MIT, © Kamil Myśliwiec)
 */

import { setNestedValue } from "./set-nested-value.util";

/**
 * Merge a partial config into the internal host record.
 *
 * When a `token` is supplied, the partial is written under that
 * namespace slot (`host[token] = partial`) — this is how
 * `registerAs('cache', factory)` results land under
 * `ConfigService.get('cache.*')`.
 *
 * When no token is supplied, the partial is shallow-assigned onto
 * the host record — used for env-loaded values that live at the
 * top level.
 *
 * @param host - The internal configuration host record to mutate.
 * @param partial - The partial config to merge in.
 * @param token - Optional namespace slot. Pass `undefined` for
 *   top-level env values.
 * @returns The `partial` value when a token was supplied; `undefined`
 *   otherwise (matches nestjs's return shape).
 */
export function mergeConfigObject(
  host: Record<string, unknown>,
  partial: Record<string, unknown>,
  token?: string | symbol,
): Record<string, unknown> | undefined {
  if (token !== undefined && token !== null) {
    // Symbol tokens bypass dotted-path parsing — pass through
    // `setNestedValue` unchanged.
    setNestedValue(host, token, partial);
    return partial;
  }
  // No token: shallow-merge onto the top level. Object.assign
  // mutates the target in place, matching nestjs.
  Object.assign(host, partial);
  return undefined;
}
