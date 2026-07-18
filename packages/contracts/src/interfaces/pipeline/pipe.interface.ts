/**
 * @file pipe.interface.ts
 * @module @stackra/contracts/interfaces/pipeline
 * @description Contract for a pipeline pipe (middleware stage).
 *
 *   Pipes receive a passable value and a `next` callback that invokes
 *   the next stage in the pipeline. The pipe can modify the passable,
 *   short-circuit the pipeline by not calling `next`, or pass a
 *   transformed value downstream.
 */

/**
 * Pipeline pipe contract.
 *
 * Any class implementing this interface can be used as a pipe stage in a
 * `Pipeline`. The `handle` method receives the current passable and a
 * closure that invokes the next pipe in the chain.
 *
 * @typeParam TPassable - The type of the value flowing through the pipeline.
 * @typeParam TReturn - The return type of the pipeline execution.
 */
export interface IPipe<TPassable = unknown, TReturn = TPassable> {
  /**
   * Handle the passable and delegate to the next pipe.
   *
   * @param passable - The current value flowing through the pipeline.
   * @param next - Callback that invokes the next pipe in the chain.
   * @returns The result after this pipe's processing.
   */
  handle(passable: TPassable, next: (passable: TPassable) => TReturn): TReturn;
}
