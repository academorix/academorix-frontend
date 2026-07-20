/**
 * @file create-mock-ai-client.ts
 * @module @stackra/ai/testing
 * @description Scripted mock `IAiClient` — resolves pre-authored
 *   endpoint responses without a network round-trip. Records every call
 *   so tests can assert on inputs.
 *
 *   Companion to {@link createMockTransport} for tests that hit the
 *   client directly (e.g. hook tests, orchestrator tests) rather than
 *   the transport.
 */

import {
  AiStreamEventType,
  type IAiChatRequest,
  type IAiClient,
  type IAiClientToolDefinition,
  type IAiStreamEvent,
  type IAiToolResult,
  type IPersona,
  type IUiContextSnapshot,
} from '@stackra/contracts';

/** Options accepted by {@link createMockAiClient}. */
export interface IMockAiClientOptions {
  /** FIFO queue of scripted chat streams (arrays of typed events). */
  chats?: IAiStreamEvent[][];
  /** Personas returned by `listPersonas()`. */
  personas?: IPersona[];
  /** Tools returned by `listTools()`. */
  tools?: IAiClientToolDefinition[];
  /** Optional override for `transcribe()`. */
  transcribe?: (audio: Uint8Array | ArrayBuffer) => Promise<{ text: string }>;
  /** Optional override for `synthesize()`. */
  synthesize?: (text: string) => Promise<ArrayBuffer>;
}

/** The client double + call-recording bookkeepers. */
export interface IMockAiClient extends IAiClient {
  /** Every `chat()` call, in order — `{persona, req}` pairs. */
  readonly chatCalls: ReadonlyArray<{ persona: string; req: IAiChatRequest }>;
  /** Every tool result posted back via `postToolResult`. */
  readonly toolResults: ReadonlyArray<IAiToolResult>;
  /** Every draft id passed to `confirmDraft`. */
  readonly draftConfirms: ReadonlyArray<string>;
  /** Every run id passed to `cancelRun`. */
  readonly runCancels: ReadonlyArray<string>;
  /** Every context snapshot passed to `syncContext`. */
  readonly contextSyncs: ReadonlyArray<IUiContextSnapshot>;
  /** Every proactive tool advertisement. */
  readonly advertisements: ReadonlyArray<IAiClientToolDefinition[]>;
  /** Queue additional chat episodes after construction. */
  queueChat(events: IAiStreamEvent[]): void;
}

/**
 * Build a scripted mock AI client.
 */
export function createMockAiClient(options: IMockAiClientOptions = {}): IMockAiClient {
  const chatQueue: IAiStreamEvent[][] = [...(options.chats ?? [])];
  const chatCalls: Array<{ persona: string; req: IAiChatRequest }> = [];
  const toolResults: IAiToolResult[] = [];
  const draftConfirms: string[] = [];
  const runCancels: string[] = [];
  const contextSyncs: IUiContextSnapshot[] = [];
  const advertisements: IAiClientToolDefinition[][] = [];

  const client: IMockAiClient = {
    chatCalls,
    toolResults,
    draftConfirms,
    runCancels,
    contextSyncs,
    advertisements,
    queueChat(events: IAiStreamEvent[]): void {
      chatQueue.push(events);
    },
    chat(persona: string, req: IAiChatRequest): AsyncIterable<IAiStreamEvent> {
      chatCalls.push({ persona, req });
      const episode = chatQueue.shift();
      if (!episode) {
        // Empty episode — yield a benign Finish event.
        async function* empty(): AsyncIterable<IAiStreamEvent> {
          yield { type: AiStreamEventType.Finish, runId: 'mock', reason: 'stop' };
        }
        return empty();
      }
      async function* iterate(): AsyncIterable<IAiStreamEvent> {
        for (const event of episode!) {
          yield event;
          await Promise.resolve();
        }
      }
      return iterate();
    },
    async cancelRun(runId: string): Promise<void> {
      runCancels.push(runId);
    },
    async postToolResult(result: IAiToolResult): Promise<void> {
      toolResults.push(result);
    },
    async confirmDraft(draftId: string): Promise<void> {
      draftConfirms.push(draftId);
    },
    async listPersonas(): Promise<IPersona[]> {
      return options.personas ?? [];
    },
    async listTools(): Promise<IAiClientToolDefinition[]> {
      return options.tools ?? [];
    },
    async advertiseTools(defs: IAiClientToolDefinition[]): Promise<void> {
      advertisements.push([...defs]);
    },
    async syncContext(snapshot: IUiContextSnapshot): Promise<void> {
      contextSyncs.push(snapshot);
    },
    async transcribe(audio: Uint8Array | ArrayBuffer): Promise<{ text: string }> {
      return options.transcribe ? options.transcribe(audio) : { text: '' };
    },
    async synthesize(text: string): Promise<ArrayBuffer> {
      return options.synthesize ? options.synthesize(text) : new ArrayBuffer(0);
    },
  };

  return client;
}
