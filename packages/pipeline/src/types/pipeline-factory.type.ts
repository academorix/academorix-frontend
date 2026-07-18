/**
 * @file pipeline-factory.type.ts
 * @module @stackra/pipeline/types
 * @description PipelineFactory type.
 */

/**
 * Factory function type for creating fresh Pipeline instances.
 *
 * Returns a new Pipeline typed with the specified passable type.
 * The factory encapsulates container injection so consumers don't need
 * to manage container references.
 *
 * @typeParam T - The passable type for the created pipeline
 */
export type PipelineFactory = <T = unknown>() => import("../services").Pipeline<T>;
