/**
 * @file ai-auth.error.ts
 * @module @stackra/ai/core/errors
 * @description Authentication / authorization failure. Surfaced by
 *   {@link SseTransport} on a 401/403 response; the `AiClientService` calls
 *   `authProvider.refresh()` once and retries — a second failure re-throws.
 */

import { AiError } from './ai.error';

/**
 * Thrown when the backend rejects a request with `401 Unauthorized` or
 * `403 Forbidden`. The `AiClientService` catches this once, refreshes
 * credentials, and retries; a second occurrence propagates to the caller.
 *
 * @see Requirement 25.3 — do not retry indefinitely.
 * @see Requirement 25.5 — request refreshed credentials before failing.
 */
export class AiAuthError extends AiError {
  /**
   * @param message - Human-readable error description.
   * @param status - The HTTP status that triggered this error (401 or 403).
   * @param cause - The originating HTTP error.
   */
  public constructor(
    message: string,
    public readonly status: number,
    cause?: unknown
  ) {
    super(message, cause);
  }
}
