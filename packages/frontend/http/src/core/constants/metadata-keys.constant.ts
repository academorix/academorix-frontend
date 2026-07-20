/**
 * Decorator metadata keys used by the http package.
 *
 * Stable strings so external bundlers can't rewrite them across
 * module boundaries. Distinct from the `HTTP_*_REGISTRY` DI tokens
 * in `@stackra/contracts` — registry tokens identify the registry
 * services, these strings identify the metadata keys carried on
 * decorated classes.
 *
 * @module @stackra/http/constants/metadata-keys
 */

/**
 * Metadata key for `@HttpMiddleware()` storage on middleware classes.
 */
export const HTTP_MIDDLEWARE_METADATA = "HTTP_MIDDLEWARE_METADATA";

/**
 * Metadata key for `@HttpInterceptor()` storage on interceptor
 * classes.
 */
export const HTTP_INTERCEPTOR_METADATA = "HTTP_INTERCEPTOR_METADATA";
