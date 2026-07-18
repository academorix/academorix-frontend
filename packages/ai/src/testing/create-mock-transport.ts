/**
 * @file create-mock-transport.ts
 * @module @stackra/ai/testing
 * @description Scripted mock `IAiTransport` — emits pre-authored raw
 *   protocol frames from `stream()` and returns pre-authored responses
 *   from `request<T>()`.
 *
 *   Suitable for feature tests that drive the `AiClientService` or the
 *   `ChatOrchestrator` without a network round-trip.
 */

import { AiConnectionState, type IAiTransport } from '@stackra/contracts';

/** A scripted stream episode. */
export interface IMockStreamEpisode {
  /** Raw protocol frames to yield in order. Use `null` to signal `[DONE]`. */
  frames: readonly string[];
}

/** Options accepted by {@link createMockTransport}. */
export interface IMockTransportOptions {
  /**
   * FIFO queue of stream episodes. Each call to `stream()` shifts the
   * head off and replays its frames. Throws if drained.
   */
  streams?: IMockStreamEpisode[];
  /**
   * FIFO queue of request responders. Each call to `request<T>()` shifts
   * the head off and invokes it with the spec. Throws if drained.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  requests?: Array<(spec: any) => unknown | Promise<unknown>>;
  /** Initial state (defaults to `Disconnected`). */
  initialState?: AiConnectionState;
}

/** The transport double + a small test-only bookkeeper. */
export interface IMockTransport extends IAiTransport {
  /** Every `stream()` call's request payload, in order. */
  readonly streamCalls: unknown[];
  /** Every `request<T>()` call's spec, in order. */
  readonly requestCalls: unknown[];
  /** Queue additional stream episodes after construction. */
  queueStream(episode: IMockStreamEpisode): void;
  /** Queue additional request responders after construction. */
  queueRequest<T>(responder: (spec: unknown) => T | Promise<T>): void;
  /** Force a state transition (for testing consumers of `onStateChange`). */
  setState(next: AiConnectionState): void;
}

/**
 * Build a scripted mock transport.
 *
 * @example
 * ```ts
 * const transport = createMockTransport({
 *   streams: [
 *     { frames: [JSON.stringify({ type: 'text-delta', id: 'm1', delta: 'Hi' }), '[DONE]'] },
 *   ],
 *   requests: [() => ({ ok: true })],
 * });
 * ```
 */
export function createMockTransport(options: IMockTransportOptions = {}): IMockTransport {
  const streamQueue: IMockStreamEpisode[] = [...(options.streams ?? [])];
  const requestQueue: Array<(spec: unknown) => unknown | Promise<unknown>> = [
    ...(options.requests ?? []),
  ];
  const streamCalls: unknown[] = [];
  const requestCalls: unknown[] = [];
  const listeners = new Set<(state: AiConnectionState) => void>();
  let _state: AiConnectionState = options.initialState ?? AiConnectionState.Disconnected;

  const setState = (next: AiConnectionState): void => {
    if (_state === next) return;
    _state = next;
    for (const listener of listeners) {
      try {
        listener(next);
      } catch {
        // Swallow — mock, not production.
      }
    }
  };

  const transport: IMockTransport = {
    get state(): AiConnectionState {
      return _state;
    },
    streamCalls,
    requestCalls,
    onStateChange(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    stream(req): AsyncIterable<string> {
      streamCalls.push(req);
      const episode = streamQueue.shift();
      if (!episode) throw new Error('[createMockTransport] no stream episode queued');
      const frames = episode.frames;
      async function* iterate(): AsyncIterable<string> {
        setState(AiConnectionState.Connecting);
        setState(AiConnectionState.Connected);
        for (const frame of frames) {
          yield frame;
          await Promise.resolve();
        }
        setState(AiConnectionState.Disconnected);
      }
      return iterate();
    },
    async request<T>(spec: unknown): Promise<T> {
      requestCalls.push(spec);
      const responder = requestQueue.shift();
      if (!responder) throw new Error('[createMockTransport] no request responder queued');
      const result = await responder(spec);
      return result as T;
    },
    queueStream(episode: IMockStreamEpisode): void {
      streamQueue.push(episode);
    },
    queueRequest<T>(responder: (spec: unknown) => T | Promise<T>): void {
      requestQueue.push(responder as (spec: unknown) => unknown | Promise<unknown>);
    },
    setState,
  };

  return transport;
}
