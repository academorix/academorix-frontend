/**
 * Middleware pipeline.
 *
 * Builds a sequential `next()`-style chain over the registry's
 * priority-sorted middleware. The terminal handler is the connector
 * (or the interceptor pipeline, which itself ends at the connector).
 *
 * Custom-built without depending on `@stackra/pipeline` so the
 * package stays small and the call chain is easy to debug.
 *
 * @module @stackra/http/services/middleware-pipeline
 */

import type {
  IHttpContext,
  IHttpMiddleware,
  IHttpNextFunction,
  IHttpResponse,
} from "@stackra/contracts";

/**
 * Stateless pipeline executor — one instance per connection.
 */
export class MiddlewarePipeline {
  /**
   * Run the context through every middleware in order, ending at
   * `terminal`. Each middleware decides whether to forward the
   * context or short-circuit.
   *
   * @param middlewares - Priority-sorted middleware (lower runs first).
   * @param context     - Live context.
   * @param terminal    - Terminal handler (connector / interceptor pipeline).
   * @returns Final response after every stage has run.
   */
  public async execute(
    middlewares: IHttpMiddleware[],
    context: IHttpContext,
    terminal: IHttpNextFunction,
  ): Promise<IHttpResponse> {
    let index = -1;

    const dispatch = async (i: number): Promise<IHttpResponse> => {
      if (i <= index) {
        throw new Error("next() called multiple times");
      }
      index = i;

      if (i >= middlewares.length) {
        return terminal(context);
      }

      const middleware = middlewares[i]!;
      // `next` accepts a context per the contract; middleware typically
      // mutate the shared instance in place, so the closed-over
      // `context` is threaded straight through.
      return middleware.handle(context, () => dispatch(i + 1));
    };

    return dispatch(0);
  }
}
