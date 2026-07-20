/**
 * @file ai.tokens.ts
 * @module @stackra/contracts/tokens
 * @description DI tokens for the AI subsystem (`@stackra/ai`).
 *
 *   Tokens live in contracts so cross-package consumers can inject the AI
 *   client, transport, registries, and services without pulling in the
 *   `@stackra/ai` runtime.
 */

/** Token for the resolved `IAiConfig` value provider. */
export const AI_CONFIG = Symbol.for("AI_CONFIG");

/** Token for the `IAiClient` endpoint service. */
export const AI_CLIENT = Symbol.for("AI_CLIENT");

/** Token for the active `IAiTransport` (SSE today, WebSocket later). */
export const AI_TRANSPORT = Symbol.for("AI_TRANSPORT");

/** Token for the `IAiStreamDecoder` (wire frames → typed events). */
export const AI_STREAM_DECODER = Symbol.for("AI_STREAM_DECODER");

/** Token for the connection-state + reconnect manager. */
export const AI_CONNECTION_MANAGER = Symbol.for("AI_CONNECTION_MANAGER");

/** Token for the chat orchestrator (send/stream/route decoded events). */
export const AI_ORCHESTRATOR = Symbol.for("AI_ORCHESTRATOR");

/** Token for the client-tool registry (metadata + handlers). */
export const AI_TOOL_REGISTRY = Symbol.for("AI_TOOL_REGISTRY");

/** Token for the client-tool → JSON-schema converter. */
export const AI_TOOL_CONVERTER = Symbol.for("AI_TOOL_CONVERTER");

/** Token for the client-tool executor. */
export const AI_TOOL_EXECUTOR = Symbol.for("AI_TOOL_EXECUTOR");

/** Token for the context-frame registry (focus stack). */
export const AI_CONTEXT_REGISTRY = Symbol.for("AI_CONTEXT_REGISTRY");

/** Token for the context collector (serialize/debounce/diff/redact/sync). */
export const AI_CONTEXT_COLLECTOR = Symbol.for("AI_CONTEXT_COLLECTOR");

/**
 * Token for the high-level `IAiContextManager` facade — a listener-friendly
 * `setFrame` / `clearFrame` / `clearAll` API over {@link AI_CONTEXT_REGISTRY}.
 * Optional at runtime — feeders inject via `@Optional() @Inject(AI_CONTEXT_MANAGER)`
 * and no-op when `@stackra/ai` isn't in the graph.
 */
export const AI_CONTEXT_MANAGER = Symbol.for("AI_CONTEXT_MANAGER");

/** Token for the PII redactor. */
export const AI_PII_REDACTOR = Symbol.for("AI_PII_REDACTOR");

/** Token for the persona/agent registry. */
export const AI_AGENT_REGISTRY = Symbol.for("AI_AGENT_REGISTRY");

/** Token for the draft-then-confirm service. */
export const AI_DRAFT_SERVICE = Symbol.for("AI_DRAFT_SERVICE");

/** Token for the conversation/thread store. */
export const AI_CONVERSATION_STORE = Symbol.for("AI_CONVERSATION_STORE");

/** Token for the consumer-supplied `IAiAuthProvider`. */
export const AI_AUTH_PROVIDER = Symbol.for("AI_AUTH_PROVIDER");

/** Metadata key stamped by the `@AiAgent` persona decorator. */
export const AI_AGENT_METADATA = Symbol.for("AI_AGENT_METADATA");
