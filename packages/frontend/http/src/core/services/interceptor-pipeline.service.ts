/**
 * Interceptor pipeline.
 *
 * Mirrors `MiddlewarePipeline` but for `IHttpInterceptor` instances.
 * The two pipelines stack — middleware runs first (one-directional
 * pre-handler stages), then the interceptors wrap the connector
 * terminal handler.
 *
 * @module @stackra/http/services/interceptor-pipeline
 */

import type {
  IHttpContext,
  IHttpInterceptor,
  IHttpNextFunction,
  IHttpResponse,
} from "@stackra/contracts";

/**
 * Stateless interceptor chain executor.
 */
export class InterceptorPipeline {
  /**
   * Run the context through every interceptor in order, ending at
   * `terminal`. Each interceptor wraps the next stage — code before
   * `next()` runs pre-handler, code after runs post-handler.
   *
   * @param interceptors - Priority-sorted interceptors.
   * @param context      - Live context.
   * @param terminal     - Terminal handler (the connector).
   * @returns Final response.
   */
  public async execute(
    interceptors: IHttpInterceptor[],
    context: IHttpContext,
    terminal: IHttpNextFunction,
  ): Promise<IHttpResponse> {
    let index = -1;

    const dispatch = async (i: number): Promise<IHttpResponse> => {
      if (i <= index) {
        throw new Error("next() called multiple times");
      }
      index = i;

      if (i >= interceptors.length) {
        return terminal(context);
      }

      const interceptor = interceptors[i]!;
      return interceptor.intercept(context, (_ctx) => dispatch(i + 1));
    };

    return dispatch(0);
  }
}
