/**
 * @file index.ts
 * @module @stackra/ai/core/transport
 * @description Barrel export for AI transports.
 *
 *   Concrete transports (`SseTransport`, and any future WebSocket
 *   transport) are bound to `AI_TRANSPORT` at the *platform* module
 *   (`WebAiModule` / `NativeAiModule`), not in `AiModule.forRoot()`.
 *   That keeps the SSE→WebSocket swap a one-line `useClass` change.
 */

export { SseTransport } from './sse.transport';
