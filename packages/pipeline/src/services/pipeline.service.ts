/**
 * @file pipeline.service.ts
 * @module @stackra/pipeline/services
 * @description Laravel-style middleware Pipeline with fluent API and DI container integration.
 *   Implements the classic array_reduce(reverse(pipes), carry(), destination) pattern
 *   for composing middleware chains with type safety.
 */

import { Injectable, Optional, Inject } from "@stackra/container";
import { APPLICATION } from "@stackra/contracts";
import type { IApplication } from "@stackra/contracts";

import type { PipeType, PipeTuple } from "../interfaces";
import { PipelineError } from "../errors";

// ════════════════════════════════════════════════════════════════════════════════
// Constants
// ════════════════════════════════════════════════════════════════════════════════

/** Default method name called on pipe objects. */
const DEFAULT_METHOD = "handle";

// ════════════════════════════════════════════════════════════════════════════════
// Pipeline Class
// ════════════════════════════════════════════════════════════════════════════════

/**
 * Laravel-style middleware pipeline with fluent API.
 *
 * Composes a chain of pipes (middleware) that process a passable value
 * sequentially. Each pipe can inspect, modify, or short-circuit the passable
 * before passing it to the next pipe in the chain.
 *
 * The pipeline supports four pipe types:
 * - **Closure** — `(passable, next) => result`
 * - **String** — resolved from the DI container by name
 * - **Object** — instance with a handler method (default: `handle`)
 * - **Tuple** — `[pipe, ...params]` for parameterized pipes
 *
 * Core algorithm (mirrors Laravel):
 * ```
 * pipeline = array_reduce(reverse(pipes), carry(), prepareDestination(destination))
 * return pipeline(passable)
 * ```
 *
 * @typeParam TPassable - The type of value flowing through the pipeline
 * @typeParam TReturn - The type returned by the pipeline's `then()` method
 *
 * @example
 * ```typescript
 * const result = new Pipeline<Request, Response>(container)
 *   .send(request)
 *   .through([AuthMiddleware, LoggingMiddleware])
 *   .then((req) => handleRequest(req));
 * ```
 */
@Injectable()
export class Pipeline<TPassable = unknown, TReturn = TPassable> {
  // ══════════════════════════════════════════════════════════════════════════════
  // Private State
  // ══════════════════════════════════════════════════════════════════════════════

  /** The value flowing through the pipeline. */
  private passable!: TPassable;

  /** The ordered list of pipes to execute. */
  private pipes: PipeType[] = [];

  /** The method name to call on pipe objects. */
  private method: string = DEFAULT_METHOD;

  /** Optional callback invoked after pipeline execution. */
  private finallyCallback?: (passable: TPassable) => void;

  /** Optional DI container for resolving string pipes. */
  private readonly container?: IApplication;

  // ══════════════════════════════════════════════════════════════════════════════
  // Constructor
  // ══════════════════════════════════════════════════════════════════════════════

  /**
   * @param container - Optional application context for resolving string-based pipes.
   *   When provided, string pipes are resolved via `container.get(pipeName)`.
   *   When omitted, string pipes will throw a PipelineError.
   */
  public constructor(@Optional() @Inject(APPLICATION) container?: IApplication) {
    this.container = container ?? undefined;
  }

  // ══════════════════════════════════════════════════════════════════════════════
  // Fluent API
  // ══════════════════════════════════════════════════════════════════════════════

  /**
   * Set the passable object being sent through the pipeline.
   *
   * @param passable - The value to send through the pipes
   * @returns This pipeline instance for chaining
   */
  public send(passable: TPassable): this {
    this.passable = passable;
    return this;
  }

  /**
   * Set the array of pipes (replaces any existing pipes).
   *
   * @param pipes - Array of pipe definitions to process the passable through
   * @returns This pipeline instance for chaining
   */
  public through(pipes: PipeType[]): this {
    this.pipes = [...pipes];
    return this;
  }

  /**
   * Append additional pipes to the pipeline.
   *
   * Unlike `through()` which replaces all pipes, `pipe()` adds to the
   * existing chain. Useful for conditionally extending a pipeline.
   *
   * @param pipes - One or more pipe definitions to append
   * @returns This pipeline instance for chaining
   */
  public pipe(...pipes: PipeType[]): this {
    this.pipes.push(...pipes);
    return this;
  }

  /**
   * Change the handler method name called on pipe objects.
   *
   * By default, the pipeline calls `handle(passable, next)` on pipe objects.
   * Use `via()` to call a different method (e.g., `process`, `transform`).
   *
   * @param method - The method name to invoke on pipe objects
   * @returns This pipeline instance for chaining
   */
  public via(method: string): this {
    this.method = method;
    return this;
  }

  /**
   * Register a finally callback invoked after pipeline execution.
   *
   * The callback receives the passable after all pipes and the destination
   * have processed it. Useful for cleanup, logging, or telemetry.
   *
   * @param callback - Function to call with the passable after execution
   * @returns This pipeline instance for chaining
   */
  public finally(callback: (passable: TPassable) => void): this {
    this.finallyCallback = callback;
    return this;
  }

  /**
   * Execute the pipeline with a final destination closure.
   *
   * The destination is the innermost function — it receives the passable
   * after all pipes have processed it. The pipeline is built using
   * `reduceRight` (equivalent to Laravel's `array_reduce(array_reverse(...))`).
   *
   * @typeParam R - The return type of the destination
   * @param destination - Final handler that produces the pipeline's return value
   * @returns The result of the destination function
   * @throws {PipelineError} When a pipe cannot be resolved or executed
   */
  public then<R = TReturn>(destination: (passable: TPassable) => R): R {
    const pipeline = this.pipes.reduceRight<(passable: TPassable) => R>((next, pipe) => {
      return (passable: TPassable): R => {
        return this.carry(pipe, passable, next as (passable: TPassable) => unknown) as R;
      };
    }, this.prepareDestination(destination));

    const result = pipeline(this.passable);

    if (this.finallyCallback) {
      this.finallyCallback(this.passable);
    }

    return result;
  }

  /**
   * Execute the pipeline and return the passable as-is.
   *
   * Equivalent to `then((passable) => passable)`. Useful when the pipeline
   * transforms the passable in place and no final destination is needed.
   *
   * @returns The passable after all pipes have processed it
   */
  public thenReturn(): TPassable {
    return this.then((passable) => passable) as unknown as TPassable;
  }

  // ══════════════════════════════════════════════════════════════════════════════
  // Private Helpers
  // ══════════════════════════════════════════════════════════════════════════════

  /**
   * Wrap the destination in a closure matching the pipeline's signature.
   *
   * @param destination - The final handler
   * @returns A closure compatible with the reduce chain
   */
  private prepareDestination<R>(
    destination: (passable: TPassable) => R,
  ): (passable: TPassable) => R {
    return (passable: TPassable): R => {
      return destination(passable);
    };
  }

  /**
   * Invoke a single pipe with the passable and next callback.
   *
   * Resolves the pipe type and delegates to the appropriate handler:
   * - Function → called directly
   * - String → resolved from container, method called
   * - Array (tuple) → first element resolved, rest are params
   * - Object → method called directly
   *
   * @param pipe - The pipe to invoke
   * @param passable - The current passable value
   * @param next - The next function in the chain
   * @returns The result of invoking the pipe
   * @throws {PipelineError} When the pipe cannot be resolved or invoked
   */
  private carry(
    pipe: PipeType,
    passable: TPassable,
    next: (passable: TPassable) => unknown,
  ): unknown {
    try {
      // Tuple pipe: [pipe, ...params]
      if (Array.isArray(pipe)) {
        return this.handleTuplePipe(pipe as PipeTuple, passable, next);
      }

      // Function pipe
      if (typeof pipe === "function") {
        return (pipe as (passable: TPassable, next: (passable: TPassable) => unknown) => unknown)(
          passable,
          next,
        );
      }

      // String pipe (container resolution)
      if (typeof pipe === "string") {
        return this.handleStringPipe(pipe, passable, next, []);
      }

      // Object pipe (instance with handler method)
      if (typeof pipe === "object" && pipe !== null) {
        return this.handleObjectPipe(pipe, passable, next, []);
      }

      throw new PipelineError(
        `Invalid pipe type: ${typeof pipe}. Expected function, string, object, or tuple.`,
        "INVALID_PIPE_TYPE",
      );
    } catch (error: unknown) {
      if (error instanceof PipelineError) {
        throw error;
      }
      const err = error as Error;
      throw new PipelineError(
        `Pipe execution failed: ${err.message}`,
        "PIPE_EXECUTION_FAILED",
        err,
      );
    }
  }

  /**
   * Handle a tuple pipe by extracting the pipe and its parameters.
   *
   * @param tuple - The [pipe, ...params] tuple
   * @param passable - The current passable
   * @param next - The next function
   * @returns The result of invoking the pipe
   */
  private handleTuplePipe(
    tuple: PipeTuple,
    passable: TPassable,
    next: (passable: TPassable) => unknown,
  ): unknown {
    const [pipeEntry, ...params] = tuple;

    if (typeof pipeEntry === "function") {
      // Function-typed pipes receive tuple extras AFTER `next`, matching
      // the object-pipe convention where `handler.call(pipe, passable,
      // next, ...params)` forwards them. Prior versions dropped
      // `params` here silently, so a function middleware wired through
      // a `[fn, ...params]` tuple never saw its params.
      return (
        pipeEntry as (
          passable: TPassable,
          next: (passable: TPassable) => unknown,
          ...args: unknown[]
        ) => unknown
      )(passable, next, ...params);
    }

    if (typeof pipeEntry === "string") {
      return this.handleStringPipe(pipeEntry, passable, next, params);
    }

    if (typeof pipeEntry === "object" && pipeEntry !== null) {
      return this.handleObjectPipe(pipeEntry, passable, next, params);
    }

    throw new PipelineError(
      `Invalid pipe entry in tuple: ${typeof pipeEntry}.`,
      "INVALID_PIPE_ENTRY",
    );
  }

  /**
   * Resolve a string pipe from the container and invoke its handler method.
   *
   * @param name - The service name/token to resolve
   * @param passable - The current passable
   * @param next - The next function
   * @param params - Additional parameters to pass to the handler
   * @returns The result of invoking the resolved pipe
   * @throws {PipelineError} When no container is available or resolution fails
   */
  private handleStringPipe(
    name: string,
    passable: TPassable,
    next: (passable: TPassable) => unknown,
    params: unknown[],
  ): unknown {
    if (!this.container) {
      throw new PipelineError(
        `Cannot resolve pipe "${name}": no DI container available. ` +
          "Provide a container to the Pipeline constructor or use object/function pipes.",
        "NO_CONTAINER",
      );
    }

    let pipeInstance: unknown;
    try {
      pipeInstance = this.container.get(name);
    } catch (error: unknown) {
      const err = error as Error;
      throw new PipelineError(
        `Failed to resolve pipe "${name}" from the container: ${err.message}`,
        "PIPE_RESOLUTION_FAILED",
        err,
      );
    }

    if (!pipeInstance || typeof pipeInstance !== "object") {
      throw new PipelineError(
        `Resolved pipe "${name}" is not an object. Got: ${typeof pipeInstance}`,
        "INVALID_RESOLVED_PIPE",
      );
    }

    return this.handleObjectPipe(pipeInstance, passable, next, params);
  }

  /**
   * Invoke a handler method on a pipe object instance.
   *
   * @param pipe - The pipe object instance
   * @param passable - The current passable
   * @param next - The next function
   * @param params - Additional parameters to pass after passable and next
   * @returns The result of invoking the method
   * @throws {PipelineError} When the method does not exist on the pipe
   */
  private handleObjectPipe(
    pipe: object,
    passable: TPassable,
    next: (passable: TPassable) => unknown,
    params: unknown[],
  ): unknown {
    const method = this.method;
    const handler = (pipe as Record<string, unknown>)[method];

    if (typeof handler !== "function") {
      const pipeName = pipe.constructor?.name ?? "anonymous";
      throw new PipelineError(
        `Pipe "${pipeName}" does not have a "${method}" method.`,
        "METHOD_NOT_FOUND",
      );
    }

    return (handler as (...args: unknown[]) => unknown).call(pipe, passable, next, ...params);
  }
}
