/**
 * @file index.ts
 * @module @stackra/pipeline
 * @description Public API for the @stackra/pipeline package.
 *   Laravel-style middleware pipeline with fluent API, DI container integration,
 *   Hub presets, and full TypeScript type safety.
 *
 *   Core pattern: `pipeline.send(data).through(pipes).then(destination)`
 */

// ════════════════════════════════════════════════════════════════════════════════
// Module
// ════════════════════════════════════════════════════════════════════════════════
export { PipelineModule } from "./pipeline.module";

// ════════════════════════════════════════════════════════════════════════════════
// Services
// ════════════════════════════════════════════════════════════════════════════════
export { Pipeline } from "./services";
export { PipelineHub } from "./services";

// ════════════════════════════════════════════════════════════════════════════════
// Constants
// ════════════════════════════════════════════════════════════════════════════════
export { PIPELINE_FACTORY } from "./constants";

// ════════════════════════════════════════════════════════════════════════════════
// Interfaces & Types
// ════════════════════════════════════════════════════════════════════════════════
export type { PipeClosure, PipeTuple, PipeEntry, PipeType, PipelineDefinition } from "./interfaces";
export type { PipelineFactory } from "./types";

// ════════════════════════════════════════════════════════════════════════════════
// Errors
// ════════════════════════════════════════════════════════════════════════════════
export { PipelineError } from "./errors";
