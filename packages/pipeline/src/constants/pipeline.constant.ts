/**
 * @file pipeline.constant.ts
 * @module @stackra/pipeline/constants
 * @description DI tokens and constants for the pipeline module.
 */

// ════════════════════════════════════════════════════════════════════════════════
// DI Tokens
// ════════════════════════════════════════════════════════════════════════════════

/**
 * DI token for the pipeline factory function.
 *
 * Inject this token to obtain a factory that creates fresh Pipeline instances.
 * Each call to the factory produces a new Pipeline with no residual state.
 *
 * @example
 * ```typescript
 * @Inject(PIPELINE_FACTORY) private readonly createPipeline: PipelineFactory
 * ```
 */
export const PIPELINE_FACTORY = Symbol.for("PIPELINE_FACTORY");
