/**
 * @file ai-client.service.ts
 * @module @stackra/ai/core/services
 * @description The endpoint layer over the transport. Attaches credentials
 *   from the injected auth provider on every request (Req 25.1), refreshes
 *   once + retries once on 401/403 (Req 25.3, 25.5), and pipes streaming
 *   chat responses through the `StreamDecoder` so consumers only ever see
 *   typed {@link IAiStreamEvent}s (Req 4).
 *
 *   Endpoint map:
 *
 *   | Method            | Endpoint                              | Req  |
 *   | ----------------- | ------------------------------------- | ---- |
 *   | `chat`            | `POST /api/ai/chat/{persona}` (SSE)   | 15.1 |
 *   | `cancelRun`       | `DELETE /api/ai/runs/{run}`           | 15.3 |
 *   | `postToolResult`  | `POST /api/ai/tool-results`           |  8.2 |
 *   | `confirmDraft`    | `POST /api/ai/drafts/{draft}/confirm` | 16.2 |
 *   | `listPersonas`    | `GET  /api/admin/ai/personas`         | 14.4 |
 *   | `listTools`       | `GET  /api/admin/ai/tools`            | 14.5 |
 *   | `advertiseTools`  | `POST /api/ai/tools/advertise`        |  7   |
 *   | `syncContext`     | `POST /api/ai/context`                | 12.5 |
 *   | `transcribe`      | `POST /api/ai/transcribe`             | 18.1 |
 *   | `synthesize`      | `POST /api/ai/tts`                    | 18.2 |
 */

import { Inject, Injectable } from '@stackra/container';
import {
  AI_AUTH_PROVIDER,
  AI_STREAM_DECODER,
  AI_TRANSPORT,
  type IAiAuthProvider,
  type IAiChatRequest,
  type IAiClient,
  type IAiClientToolDefinition,
  type IAiStreamDecoder,
  type IAiStreamEvent,
  type IAiToolResult,
  type IAiTransport,
  type IPersona,
  type IUiContextSnapshot,
} from '@stackra/contracts';

import { AiAuthError } from '../errors';
import { base64Decode, base64Encode } from '../utils/base64.util';

/**
 * `IAiClient` implementation.
 */
@Injectable()
export class AiClientService implements IAiClient {
  /**
   * @param transport - The bound transport (SSE today, WebSocket later).
   * @param decoder - The wire-format-aware decoder.
   * @param authProvider - Consumer-supplied credentials provider.
   */
  public constructor(
    @Inject(AI_TRANSPORT) private readonly transport: IAiTransport,
    @Inject(AI_STREAM_DECODER) private readonly decoder: IAiStreamDecoder,
    @Inject(AI_AUTH_PROVIDER) private readonly authProvider: IAiAuthProvider
  ) {}

  // ────────────────────────────────────────────────────────────────────
  // Streaming chat
  // ────────────────────────────────────────────────────────────────────

  /**
   * Stream a chat turn for a persona. Yields typed {@link IAiStreamEvent}s
   * decoded from the transport's raw frames.
   *
   * If the initial handshake fails with 401/403, the client calls
   * `authProvider.refresh()` and retries the stream once. Auth failures
   * that happen after events have been yielded propagate immediately
   * (we can't retroactively re-issue events).
   *
   * `[DONE]` sentinels terminate the generator without yielding.
   * `Error` events from the decoder are yielded (they are recoverable
   * per Req 4.6).
   */
  public async *chat(
    persona: string,
    req: IAiChatRequest,
    signal: AbortSignal
  ): AsyncIterable<IAiStreamEvent> {
    let attemptedRefresh = false;
    // The retry loop only re-opens when we've yielded nothing yet.
    // eslint-disable-next-line no-constant-condition
    while (true) {
      let yielded = false;
      try {
        for await (const frame of this.transport.stream({ ...req, persona }, signal)) {
          const event = this.decoder.decode(frame);
          if (event === null) return; // `[DONE]` sentinel — Req 4.5.
          yielded = true;
          yield event;
        }
        return;
      } catch (err) {
        if (err instanceof AiAuthError && !attemptedRefresh && !yielded) {
          attemptedRefresh = true;
          await this.authProvider.refresh();
          continue;
        }
        throw err;
      }
    }
  }

  // ────────────────────────────────────────────────────────────────────
  // Run / draft / result endpoints
  // ────────────────────────────────────────────────────────────────────

  /** Cancel an in-flight run (Req 15.3). */
  public async cancelRun(runId: string): Promise<void> {
    await this.withAuthRetry(() =>
      this.transport.request<void>({
        method: 'DELETE',
        path: `/api/ai/runs/${encodeURIComponent(runId)}`,
      })
    );
  }

  /** Post a client-tool result back against its originating tool call (Req 8.2). */
  public async postToolResult(result: IAiToolResult): Promise<void> {
    await this.withAuthRetry(() =>
      this.transport.request<void>({
        method: 'POST',
        path: '/api/ai/tool-results',
        body: result,
      })
    );
  }

  /** Confirm a pending draft-then-confirm write (Req 16.2). */
  public async confirmDraft(draftId: string): Promise<void> {
    await this.withAuthRetry(() =>
      this.transport.request<void>({
        method: 'POST',
        path: `/api/ai/drafts/${encodeURIComponent(draftId)}/confirm`,
      })
    );
  }

  // ────────────────────────────────────────────────────────────────────
  // Catalogs
  // ────────────────────────────────────────────────────────────────────

  /** Retrieve the backend persona catalog (Req 14.4). */
  public async listPersonas(): Promise<IPersona[]> {
    return this.withAuthRetry(() =>
      this.transport.request<IPersona[]>({
        method: 'GET',
        path: '/api/admin/ai/personas',
      })
    );
  }

  /** Retrieve the backend tool catalog (Req 14.5). */
  public async listTools(): Promise<IAiClientToolDefinition[]> {
    return this.withAuthRetry(() =>
      this.transport.request<IAiClientToolDefinition[]>({
        method: 'GET',
        path: '/api/admin/ai/tools',
      })
    );
  }

  // ────────────────────────────────────────────────────────────────────
  // Toolset advertisement + context sync
  // ────────────────────────────────────────────────────────────────────

  /**
   * Advertise the current converted client-tool definitions to the backend.
   *
   * By design (see `design.md`), advertisement piggybacks the chat request
   * — the `tools` field of {@link IAiChatRequest} carries the current set
   * on every turn. This method exists as a proactive push channel for
   * consumers that want to notify the backend between turns.
   */
  public async advertiseTools(defs: IAiClientToolDefinition[]): Promise<void> {
    await this.withAuthRetry(() =>
      this.transport.request<void>({
        method: 'POST',
        path: '/api/ai/tools/advertise',
        body: { tools: defs },
      })
    );
  }

  /** Sync a UI context snapshot on the context channel (Req 12.5). */
  public async syncContext(snapshot: IUiContextSnapshot): Promise<void> {
    await this.withAuthRetry(() =>
      this.transport.request<void>({
        method: 'POST',
        path: '/api/ai/context',
        body: snapshot,
      })
    );
  }

  // ────────────────────────────────────────────────────────────────────
  // Speech (Req 18)
  // ────────────────────────────────────────────────────────────────────

  /** Transcribe audio to text. */
  public async transcribe(audio: Uint8Array | ArrayBuffer): Promise<{ text: string }> {
    return this.withAuthRetry(() =>
      this.transport.request<{ text: string }>({
        method: 'POST',
        path: '/api/ai/transcribe',
        body: { audio: base64Encode(audio) },
      })
    );
  }

  /** Synthesize speech from text. */
  public async synthesize(text: string): Promise<ArrayBuffer> {
    const response = await this.withAuthRetry(() =>
      this.transport.request<{ audio: string }>({
        method: 'POST',
        path: '/api/ai/tts',
        body: { text },
      })
    );
    return base64Decode(response.audio);
  }

  // ────────────────────────────────────────────────────────────────────
  // Internal — one-refresh + one-retry auth guard
  // ────────────────────────────────────────────────────────────────────

  /**
   * Wrap a one-shot backend call with the "refresh once, retry once" auth
   * pattern (Req 25.3 + 25.5). A second `AiAuthError` propagates.
   */
  private async withAuthRetry<T>(op: () => Promise<T>): Promise<T> {
    try {
      return await op();
    } catch (err) {
      if (!(err instanceof AiAuthError)) throw err;
      // Give the auth provider one chance to refresh credentials, then retry.
      await this.authProvider.refresh();
      return op();
    }
  }
}
