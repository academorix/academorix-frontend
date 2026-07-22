/**
 * @file index.ts
 * Constants barrel.
 *
 * @module @stackra/http/constants
 */

export { HTTP_MIDDLEWARE_METADATA, HTTP_INTERCEPTOR_METADATA } from "./metadata-keys.constant";
export {
  DEFAULT_RATE_LIMIT,
  DEFAULT_CIRCUIT_BREAKER,
  DEFAULT_MAX_RETRIES,
  DEFAULT_RETRY_BACKOFF,
  DEFAULT_TIMEOUT_MS,
} from "./defaults.constant";
