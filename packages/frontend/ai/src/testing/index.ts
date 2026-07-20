/**
 * @file src/testing/index.ts
 * @module @stackra/ai/testing
 * @description Public API for the test doubles of `@stackra/ai` (the
 *   `./testing` subpath): scripted mock transport, mock AI client, and
 *   mock tool registry.
 *
 *   Consumers use these to test `useAiChat`, `useAiTool`,
 *   `ChatOrchestrator`, and the DI wiring without a live backend.
 */

export { createMockTransport } from "./create-mock-transport";
export type {
  IMockTransport,
  IMockTransportOptions,
  IMockStreamEpisode,
} from "./create-mock-transport";

export { createMockAiClient } from "./create-mock-ai-client";
export type { IMockAiClient, IMockAiClientOptions } from "./create-mock-ai-client";

export { createMockToolRegistry } from "./create-mock-tool-registry";
export type { IMockToolRegistry } from "./create-mock-tool-registry";
