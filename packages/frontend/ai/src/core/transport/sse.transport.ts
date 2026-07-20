/**
 * @file sse.transport.ts
 * @module @stackra/ai/core/transport
 * @description The default `IAiTransport` implementation — an SSE stream
 *   over `@stackra/http`.
 *
 *   `SseTransport` is the single point in `@stackra/ai` that knows the
 *   connection technology (Requirement 3.5). Swapping SSE for WebSocket
 *   later is a one-line `useClass` change in the platform module
 *   (`WebAiModule` / `NativeAiModule`) — no hook or component code
 *   changes.
 *
 *   The transport:
 *
 *   - opens a `POST /api/ai/chat/{persona}` SSE stream via the injected
 *     `IHttpClient` and yields raw protocol frames (strings);
 *   - performs one-shot backend requests (`request<T>`);
 *   - attaches credentials from the injected `IAiAuthProvider` on every
 *     stream and request (Requirement 25.1);
 *   - exposes the {@link AiConnectionState} state machine (Requirement 24.1);
 *   - throws {@link AiAuthError} on 401/403 so `AiClientService` can
 *     refresh credentials and retry once (Requirement 25.3, 25.5);
 *   - throws {@link AiTransportError} on any other transport failure.
 *
 *   It does *not* parse AI semantics — decoded events are the
 *   `StreamDecoder`'s responsibility.
 */

import { Inject, Injectable } from '@stackra/container';
import { Logger } from '@stackra/logger';
import {
  AI_AUTH_PROVIDER,
  AI_CONFIG,
  AiConnectionState,
  HTTP_MANAGER,
  type IAiAuthProvider,
  type IAiChatRequest,
  type IAiConfig,
  type IAiCredentials,
  type IAiRequestSpec,
  type IAiTransport,
  type IHttpManager,
  type IHttpRequestConfig,
} from '@stackra/contracts';

import { AiAuthError, AiTransportError } from '../errors';

/** Listener invoked when the connection state changes. */
type StateListener = (state: AiConnectionState) => void;

/**
 * SSE-over-HTTP implementation of {@link IAiTransport}.
 */
@Injectable()
export class SseTransport implements IAiTransport {
  private readonly logger = new Logger(SseTransport.name);

  /** Current observable connection state. */
  private _state: AiConnectionState = AiConnectionState.Disconnected;

  /** State-change listeners. */
  private readonly listeners = new Set<StateListener>();

  /**
   * @param config - Resolved AI configuration (base URL, connection name).
   * @param authProvider - Consumer-supplied credentials provider.
   * @param httpManager - The `@stackra/http` connection manager.
   */
  public constructor(
    @Inject(AI_CONFIG) private readonly config: IAiConfig,
    @Inject(AI_AUTH_PROVIDER) private readonly authProvider: IAiAuthProvider,
    @Inject(HTTP_MANAGER) private readonly httpManager: IHttpManager
  ) {}

  /** @inheritdoc */
  public get state(): AiConnectionState {
    return this._state;
  }

  /** @inheritdoc */
  public onStateChange(listener: StateListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  // ────────────────────────────────────────────────────────────────────
  // Streaming chat
  // ────────────────────────────────────────────────────────────────────

  /**
   * Open a streaming chat request. Yields raw protocol frames.
   *
   * Semantic decoding is the `StreamDecoder`'s job — this method only
   * knows how to move bytes.
   *
   * @param req - The chat request (persona, thread, message, tools).
   * @param signal - External cancellation signal.
   */
  public async *stream(req: IAiChatRequest, signal: AbortSignal): AsyncIterable<string> {
    this.setState(AiConnectionState.Connecting);

    const credentials = await this.authProvider.getCredentials();
    const client = await this.httpManager.connection(this.config.connection);
    const url = `${this.trimSlash(this.config.baseUrl)}/api/ai/chat/${encodeURIComponent(req.persona)}`;

    const httpStream = client.sse<unknown>(url, {
      method: 'POST',
      data: req,
      headers: this.buildHeaders(credentials),
      signal,
    });

    // Wire the caller's abort signal to the http stream. `httpClient.sse`
    // already forwards `signal` internally, but keeping this explicit
    // cancel() call means transport-level cancellation stays deterministic
    // even for future transports where the http-level plumbing differs.
    signal.addEventListener('abort', () => httpStream.cancel(), { once: true });

    try {
      this.setState(AiConnectionState.Connected);
      for await (const event of httpStream) {
        // The SSE parser JSON-parses `data:` payloads by default. Re-serialize
        // objects so the `StreamDecoder` always sees strings (Req 4).
        yield typeof event.data === 'string' ? event.data : JSON.stringify(event.data);
      }
      this.setState(AiConnectionState.Disconnected);
    } catch (err) {
      this.setState(AiConnectionState.Error);
      throw this.normalizeError(err);
    }
  }

  // ────────────────────────────────────────────────────────────────────
  // One-shot request
  // ────────────────────────────────────────────────────────────────────

  /**
   * Perform a one-shot backend request. Consumed by the client for
   * non-streaming endpoints (`cancelRun`, `confirmDraft`, `listPersonas`,
   * `listTools`, `advertiseTools`, `syncContext`, `transcribe`,
   * `synthesize`).
   *
   * @param spec - The request specification.
   * @returns The decoded response body.
   */
  public async request<T>(spec: IAiRequestSpec): Promise<T> {
    const credentials = await this.authProvider.getCredentials();
    const client = await this.httpManager.connection(this.config.connection);
    const url = `${this.trimSlash(this.config.baseUrl)}${spec.path.startsWith('/') ? spec.path : `/${spec.path}`}`;

    const config: IHttpRequestConfig = {
      method: spec.method,
      url,
      data: spec.body,
      headers: { ...this.buildHeaders(credentials), ...spec.headers },
    };

    try {
      const response = await client.request<T>(config);
      return response.data;
    } catch (err) {
      throw this.normalizeError(err);
    }
  }

  // ────────────────────────────────────────────────────────────────────
  // Internal helpers
  // ────────────────────────────────────────────────────────────────────

  /** Build the outgoing header set from the current credentials. */
  private buildHeaders(credentials: IAiCredentials): Record<string, string> {
    const headers: Record<string, string> = { ...credentials.headers };
    if (credentials.token) {
      headers.Authorization = `Bearer ${credentials.token}`;
    }
    return headers;
  }

  /** Strip a trailing slash so `${baseUrl}/api/...` never doubles up. */
  private trimSlash(url: string): string {
    return url.endsWith('/') ? url.slice(0, -1) : url;
  }

  /** Update state and fan out to every registered listener. */
  private setState(next: AiConnectionState): void {
    if (this._state === next) return;
    this._state = next;
    for (const listener of this.listeners) {
      try {
        listener(next);
      } catch (err) {
        this.logger.warn('[SseTransport] state listener threw', {
          error: err instanceof Error ? err.message : String(err),
        });
      }
    }
  }

  /**
   * Normalise an HTTP error into the AI error hierarchy so consumers can
   * distinguish auth failures (retry once after refresh) from transport
   * failures (surface immediately).
   */
  private normalizeError(err: unknown): Error {
    const status = this.extractStatus(err);
    if (status === 401 || status === 403) {
      return new AiAuthError(`[SseTransport] authentication failed (${status})`, status, err);
    }
    if (err instanceof Error) {
      return new AiTransportError(`[SseTransport] ${err.message}`, err);
    }
    return new AiTransportError('[SseTransport] transport failure', err);
  }

  /** Best-effort extraction of a numeric HTTP status from an unknown error. */
  private extractStatus(err: unknown): number | undefined {
    if (err && typeof err === 'object') {
      const record = err as Record<string, unknown>;
      // `IHttpError` (normalised) uses `statusCode`; some libraries use `status`.
      if (typeof record.statusCode === 'number') return record.statusCode;
      if (typeof record.status === 'number') return record.status;
      const response = record.response as Record<string, unknown> | undefined;
      if (response && typeof response.status === 'number') return response.status;
    }
    return undefined;
  }
}
