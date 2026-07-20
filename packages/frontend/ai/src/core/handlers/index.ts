/**
 * @file index.ts
 * @module @stackra/ai/core/handlers
 * @description Public API barrel for framework Action handlers shipped
 *   by `@stackra/ai`. Consumers wire them via
 *   `ActionsModule.forFeature([...])` in their `AppModule` when they
 *   want AI tool calls to flow through the shared action pipeline.
 */

export { AiToolActionHandler } from "./ai-tool-action.handler";
