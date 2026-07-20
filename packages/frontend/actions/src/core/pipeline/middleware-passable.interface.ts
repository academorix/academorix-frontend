/**
 * @file middleware-passable.interface.ts
 * @module @stackra/actions/core/pipeline
 * @description The envelope threaded through every pipe in the action
 *   middleware pipeline.
 */

import type {
  IActionContext,
  IActionDescriptor,
  IActionHandler,
  IActionResponse,
} from "@stackra/contracts";

/**
 * Envelope threaded through every action middleware pipe.
 *
 * Pipes read `descriptor` + `context`, may mutate `response` (to
 * short-circuit), and hand the envelope to `next()`.
 */
export interface IMiddlewarePassable {
  descriptor: IActionDescriptor;
  context: IActionContext;
  handler: IActionHandler;
  response?: IActionResponse;
  startedAt?: number;
}
