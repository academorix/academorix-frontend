/**
 * @file pipeline-hub.service.ts
 * @module @stackra/pipeline/services
 * @description Named pipeline presets registry (Hub).
 *   Allows registering named pipeline definitions and executing them by name.
 *   Equivalent to Laravel's Pipeline Hub concept for reusable pipeline configurations.
 */

import { Injectable, Optional, Inject } from "@stackra/container";
import { APPLICATION } from "@stackra/contracts";
import type { IApplication } from "@stackra/contracts";

import type { PipelineDefinition } from "../interfaces";
import { Pipeline } from "./pipeline.service";
import { PipelineError } from "../errors";

// ════════════════════════════════════════════════════════════════════════════════
// Hub Class
// ════════════════════════════════════════════════════════════════════════════════

/**
 * Named pipeline presets registry.
 *
 * The Hub stores named pipeline definitions that can be executed by name.
 * This enables reusable pipeline configurations that multiple consumers
 * can invoke without knowing the pipe chain details.
 *
 * A `defaults` pipeline is used as the fallback when no specific pipeline
 * name is provided to `pipe()`.
 *
 * @example
 * ```typescript
 * const hub = new PipelineHub(container);
 *
 * hub.pipeline('order-validation', (pipeline, passable) =>
 *   pipeline
 *     .send(passable)
 *     .through([ValidateStock, ValidatePayment, ValidateAddress])
 *     .thenReturn()
 * );
 *
 * const result = hub.pipe(orderData, 'order-validation');
 * ```
 */
@Injectable()
export class PipelineHub {
  // ══════════════════════════════════════════════════════════════════════════════
  // Private State
  // ══════════════════════════════════════════════════════════════════════════════

  /** Registry of named pipeline definitions. */
  private readonly pipelines: Map<string, PipelineDefinition> = new Map();

  /** Default pipeline definition (fallback when no name specified). */
  private defaultPipeline?: PipelineDefinition;

  /** Optional DI container for creating Pipeline instances. */
  private readonly container?: IApplication;

  // ══════════════════════════════════════════════════════════════════════════════
  // Constructor
  // ══════════════════════════════════════════════════════════════════════════════

  /**
   * @param container - Optional application context passed to created Pipeline instances
   */
  public constructor(@Optional() @Inject(APPLICATION) container?: IApplication) {
    this.container = container ?? undefined;
  }

  // ══════════════════════════════════════════════════════════════════════════════
  // Public API
  // ══════════════════════════════════════════════════════════════════════════════

  /**
   * Register the default pipeline definition.
   *
   * The default pipeline is used when `pipe()` is called without a name.
   *
   * @param callback - Pipeline definition that configures and executes a pipeline
   */
  public defaults(callback: PipelineDefinition): void {
    this.defaultPipeline = callback;
  }

  /**
   * Register a named pipeline definition.
   *
   * @param name - Unique name for this pipeline preset
   * @param callback - Pipeline definition that configures and executes a pipeline
   * @throws {PipelineError} When the name is empty
   */
  public pipeline(name: string, callback: PipelineDefinition): void {
    if (!name) {
      throw new PipelineError("Pipeline name cannot be empty.", "INVALID_PIPELINE_NAME");
    }
    this.pipelines.set(name, callback);
  }

  /**
   * Execute a named (or default) pipeline with the given passable.
   *
   * Creates a fresh Pipeline instance, passes it along with the passable
   * to the registered definition, and returns the result.
   *
   * @typeParam T - The type of the passable value
   * @param passable - The value to send through the pipeline
   * @param pipelineName - Optional name of the pipeline preset to execute.
   *   Falls back to the default pipeline if omitted.
   * @returns The result of the pipeline execution
   * @throws {PipelineError} When the named pipeline or default is not registered
   */
  public pipe<T>(passable: T, pipelineName?: string): unknown {
    const definition = this.resolveDefinition(pipelineName);
    const pipeline = new Pipeline(this.container);

    return definition(pipeline, passable);
  }

  /**
   * Check if a named pipeline definition exists in the registry.
   *
   * @param name - The pipeline name to check
   * @returns True if the pipeline is registered
   */
  public has(name: string): boolean {
    return this.pipelines.has(name);
  }

  // ══════════════════════════════════════════════════════════════════════════════
  // Private Helpers
  // ══════════════════════════════════════════════════════════════════════════════

  /**
   * Resolve a pipeline definition by name or fall back to the default.
   *
   * @param name - Optional pipeline name
   * @returns The resolved pipeline definition
   * @throws {PipelineError} When the definition cannot be found
   */
  private resolveDefinition(name?: string): PipelineDefinition {
    if (name) {
      const definition = this.pipelines.get(name);
      if (!definition) {
        throw new PipelineError(
          `Pipeline "${name}" is not registered in the hub.`,
          "PIPELINE_NOT_FOUND",
        );
      }
      return definition;
    }

    if (!this.defaultPipeline) {
      throw new PipelineError(
        "No default pipeline is registered. Call hub.defaults() or provide a pipeline name.",
        "NO_DEFAULT_PIPELINE",
      );
    }

    return this.defaultPipeline;
  }
}
