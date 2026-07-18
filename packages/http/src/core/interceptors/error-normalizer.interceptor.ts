/**
 * Error-normalizer interceptor.
 *
 * Outermost interceptor (priority 5). Wraps the entire
 * interceptor/connector chain in try/catch and converts every raw
 * error (axios, fetch, AbortError, normalized HttpError, generic
 * Error) into a uniform `IHttpError` shape that downstream consumers
 * can branch on without `instanceof` checks.
 *
 * @module @stackra/http/interceptors/error-normalizer
 */

import type {
  IHttpContext,
  IHttpError,
  IHttpInterceptor,
  IHttpNextFunction,
  IHttpResponse,
} from '@stackra/contracts';

import { HttpInterceptor } from '../decorators/http-interceptor.decorator';

/**
 * Error-normalizer interceptor.
 */
@HttpInterceptor({ priority: 5, name: 'error-normalizer' })
export class ErrorNormalizerInterceptor implements IHttpInterceptor {
  /** @inheritdoc */
  public async intercept(context: IHttpContext, next: IHttpNextFunction): Promise<IHttpResponse> {
    try {
      return await next(context);
    } catch (err: Error | any) {
      throw this.normalize(err, context);
    }
  }

  /** Convert any thrown value into an `IHttpError`. */
  private normalize(err: unknown, context: IHttpContext): IHttpError {
    // Already-normalized — propagate unchanged.
    if (this.isHttpError(err)) return err;

    // Axios errors carry `.response` / `.code`. We don't import axios
    // — duck-type instead so the interceptor stays driver-agnostic.
    const maybeAxios = err as {
      isAxiosError?: boolean;
      response?: {
        data?: unknown;
        status?: number;
        statusText?: string;
        headers?: Record<string, string>;
      };
      code?: string;
      message?: string;
    };

    if (maybeAxios?.isAxiosError) {
      if (maybeAxios.code === 'ECONNABORTED' || maybeAxios.code === 'ETIMEDOUT') {
        return {
          message: `Request timeout after ${context.request.timeout ?? 30000}ms`,
          statusCode: 0,
          config: context.request,
          isHttpError: true,
        };
      }

      if (!maybeAxios.response) {
        return {
          message: maybeAxios.message ?? 'Network error — no response received',
          statusCode: 0,
          config: context.request,
          isHttpError: true,
        };
      }

      const data = maybeAxios.response.data as
        { message?: string; errors?: Record<string, string[]> } | undefined;
      return {
        message: data?.message ?? maybeAxios.response.statusText ?? 'Request failed',
        statusCode: maybeAxios.response.status ?? 0,
        ...(data?.errors !== undefined ? { errors: data.errors } : {}),
        response: {
          data: maybeAxios.response.data,
          status: maybeAxios.response.status ?? 0,
          statusText: maybeAxios.response.statusText ?? '',
          headers: maybeAxios.response.headers ?? {},
          config: context.request,
        },
        config: context.request,
        isHttpError: true,
      };
    }

    // AbortError surfaces as a DOMException when fetch is cancelled.
    const abort = err as { name?: string; message?: string };
    if (abort?.name === 'AbortError') {
      return {
        message: abort.message ?? 'Request aborted',
        statusCode: 0,
        config: context.request,
        isHttpError: true,
      };
    }

    const message = err instanceof Error ? err.message : 'An unexpected error occurred';
    return {
      message,
      statusCode: 0,
      config: context.request,
      isHttpError: true,
    };
  }

  /** Type guard for already-normalized errors. */
  private isHttpError(err: unknown): err is IHttpError {
    return (
      typeof err === 'object' &&
      err !== null &&
      'isHttpError' in err &&
      (err as { isHttpError?: unknown }).isHttpError === true
    );
  }
}
