/**
 * @file pipeline.module.ts
 * @module @stackra/pipeline
 * @description DI module for the pipeline system.
 *   Registers the PipelineHub as a global singleton and provides a
 *   PIPELINE_FACTORY token for creating fresh Pipeline instances on demand.
 *
 *   The Pipeline class itself is NOT a singleton — each usage creates a new
 *   instance via the factory. This ensures no state leaks between usages.
 */

import { Module } from "@stackra/container";
import type { DynamicModule } from "@stackra/contracts";
import { APPLICATION } from "@stackra/contracts";
import type { IApplication } from "@stackra/contracts";

import { PipelineHub } from "./services";
import { Pipeline } from "./services";
import { PIPELINE_FACTORY } from "./constants";

// ════════════════════════════════════════════════════════════════════════════════
// Module
// ════════════════════════════════════════════════════════════════════════════════

/**
 * Pipeline DI module.
 *
 * Provides:
 * - `PipelineHub` — global singleton for named pipeline presets
 * - `PIPELINE_FACTORY` — factory function for creating fresh Pipeline instances
 *
 * The Pipeline is intentionally NOT registered as a singleton. Each call to
 * the factory produces a new instance with clean state. This mirrors Laravel's
 * pattern where `app(Pipeline::class)` always returns a fresh pipeline.
 *
 * @example
 * ```typescript
 * import { PipelineModule } from '@stackra/pipeline';
 *
 * @Module({
 *   imports: [PipelineModule.forRoot()],
 * })
 * export class AppModule {}
 * ```
 *
 * @example
 * ```typescript
 * // Injecting the factory in a service
 * @Injectable()
 * class OrderService {
 *   constructor(
 *     @Inject(PIPELINE_FACTORY) private readonly createPipeline: PipelineFactory,
 *   ) {}
 *
 *   processOrder(order: Order): Order {
 *     return this.createPipeline<Order>()
 *       .send(order)
 *       .through([ValidateOrder, CalculateTax, ApplyDiscount])
 *       .thenReturn();
 *   }
 * }
 * ```
 */
@Module({})
export class PipelineModule {
  /**
   * Register the pipeline module globally.
   *
   * @returns Dynamic module definition with PipelineHub and factory
   */
  public static forRoot(): DynamicModule {
    return {
      module: PipelineModule,
      global: true,
      providers: [
        // PipelineHub singleton
        PipelineHub,

        // Pipeline factory — creates fresh instances on demand
        {
          provide: PIPELINE_FACTORY,
          useFactory: (app?: IApplication) => {
            return <T>(): Pipeline<T> => new Pipeline<T>(app);
          },
          inject: [{ token: APPLICATION, optional: true }],
        },
      ],
      exports: [PipelineHub, PIPELINE_FACTORY],
    };
  }
}
