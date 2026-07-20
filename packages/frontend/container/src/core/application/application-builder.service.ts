/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * @file application-builder.service.ts
 * @module @stackra/container/application
 * @description Fluent builder for bootstrapping an ApplicationContext instance.
 *   Wraps ApplicationFactory.create() with lifecycle hooks and options.
 */

import type { Type } from "@stackra/contracts";

import type { IApplicationBuilderOptions } from "@/core/interfaces";
import type { ApplicationContext } from "./application-context.service";
import { ApplicationFactory } from "./application.factory";

/**
 * Fluent builder for bootstrapping an ApplicationContext instance.
 *
 * Encapsulates the full bootstrap sequence: before-boot hooks,
 * context creation, and post-boot hooks.
 *
 * @example
 * ```typescript
 * const app = await Application.builder(AppModule)
 *   .withOptions({ debug: true })
 *   .onBeforeBoot(() => console.log('Starting...'))
 *   .onBoot((ctx) => console.log('Ready!'))
 *   .boot();
 * ```
 */
export class ApplicationBuilder {
  /** The root module class or factory function. */
  private readonly rootModule: Type<any> | (() => Promise<Type<any>>);

  /** Options passed to ApplicationFactory.create(). */
  private options: IApplicationBuilderOptions = {};

  /** Hooks executed before DI container creation. */
  private beforeBootHooks: Array<() => void | Promise<void>> = [];

  /** Hooks executed after DI container creation. */
  private bootHooks: Array<(ctx: ApplicationContext) => void | Promise<void>> = [];

  /**
   * @param rootModule - Root module class or async factory function
   */
  public constructor(rootModule: Type<any> | (() => Promise<Type<any>>)) {
    this.rootModule = rootModule;
  }

  // ============================================================================
  // Configuration
  // ============================================================================

  /**
   * Set options passed to ApplicationFactory.create().
   *
   * @param options - Builder options
   * @returns This builder for chaining
   */
  public withOptions(options: IApplicationBuilderOptions): this {
    this.options = { ...this.options, ...options };
    return this;
  }

  // ============================================================================
  // Lifecycle Hooks
  // ============================================================================

  /**
   * Register a hook to run before the DI container is created.
   *
   * @param hook - Callback (can be async)
   * @returns This builder for chaining
   */
  public onBeforeBoot(hook: () => void | Promise<void>): this {
    this.beforeBootHooks.push(hook);
    return this;
  }

  /**
   * Register a hook to run after the DI container is created.
   *
   * @param hook - Callback receiving the bootstrapped context (can be async)
   * @returns This builder for chaining
   */
  public onBoot(hook: (ctx: ApplicationContext) => void | Promise<void>): this {
    this.bootHooks.push(hook);
    return this;
  }

  // ============================================================================
  // Boot
  // ============================================================================

  /**
   * Execute the bootstrap sequence.
   *
   * 1. Run all beforeBootHooks
   * 2. Resolve the root module (supports dynamic imports)
   * 3. Call ApplicationFactory.create()
   * 4. Run all bootHooks
   * 5. Return the ApplicationContext
   *
   * @returns The bootstrapped ApplicationContext
   */
  public async boot(): Promise<ApplicationContext> {
    // Phase 1: Before-boot hooks
    for (const hook of this.beforeBootHooks) {
      await hook();
    }

    // Phase 2: Resolve root module
    const resolvedModule =
      typeof this.rootModule === "function" && !this.rootModule.prototype
        ? await (this.rootModule as () => Promise<Type<any>>)()
        : (this.rootModule as Type<any>);

    // Phase 3: Create DI container
    const context = await ApplicationFactory.create(resolvedModule, this.options);

    // Phase 4: Boot hooks
    for (const hook of this.bootHooks) {
      await hook(context);
    }

    return context;
  }
}
