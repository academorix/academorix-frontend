/**
 * Cache operation error.
 *
 * Raised by the cache interceptor / middleware when a cache backend
 * operation fails. The interceptor catches and degrades gracefully —
 * this error is exposed so consumers that want strict cache
 * semantics can opt into rethrowing.
 *
 * @module @stackra/http/errors/http-cache
 */

import { HttpError } from './http.error';

/**
 * Cache operation error.
 */
export class HttpCacheError extends HttpError {
  public override readonly name: string = 'HttpCacheError';
  public override readonly code: string = 'HTTP_CACHE_ERROR';
}
