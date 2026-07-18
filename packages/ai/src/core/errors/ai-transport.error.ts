/**
 * @file ai-transport.error.ts
 * @module @stackra/ai/core/errors
 * @description Transport-layer failure — the underlying stream or one-shot
 *   request could not complete. Wraps the originating error under `.cause`.
 */

import { AiError } from './ai.error';

/**
 * Thrown by `SseTransport` (and any future `IAiTransport` implementation)
 * when a stream cannot be opened, is severed mid-flight, or a one-shot
 * request fails with a non-auth error.
 *
 * Distinguished from {@link AiAuthError} — auth failures carry retry
 * semantics (one refresh + retry) that transport errors do not.
 */
export class AiTransportError extends AiError {}
