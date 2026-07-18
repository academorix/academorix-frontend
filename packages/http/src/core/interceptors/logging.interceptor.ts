/**
 * Logging interceptor.
 *
 * Records request/response duration and status. Always-on but the
 * level escalates by status: success → debug, 4xx → warn, 5xx →
 * error.
 *
 * @module @stackra/http/interceptors/logging
 */

import { Logger } from '@stackra/logger';

import type {
  IHttpContext,
  IHttpInterceptor,
  IHttpNextFunction,
  IHttpResponse,
} from '@stackra/contracts';

import { HttpInterceptor } from '../decorators/http-interceptor.decorator';

/**
 * Logging interceptor.
 */
@HttpInterceptor({ priority: 95, name: 'logging' })
export class LoggingInterceptor implements IHttpInterceptor {
  /** Scoped logger. */
  private readonly logger = new Logger(LoggingInterceptor.name);

  /** @inheritdoc */
  public async intercept(context: IHttpContext, next: IHttpNextFunction): Promise<IHttpResponse> {
    const startedAt = Date.now();
    const { method, url, baseURL } = context.request;
    const fullUrl = LoggingInterceptor.fullUrl(baseURL, url);

    try {
      const response = await next(context);
      const duration = Date.now() - startedAt;
      const message = `[HTTP] ${method ?? 'GET'} ${fullUrl} → ${response.status} (${duration}ms)`;
      if (response.status >= 500) this.logger.error(message);
      else if (response.status >= 400) this.logger.warn(message);
      else this.logger.debug(message);
      return response;
    } catch (err: Error | any) {
      const duration = Date.now() - startedAt;
      const status = (err as { statusCode?: number }).statusCode ?? 0;
      this.logger.warn(`[HTTP] ${method ?? 'GET'} ${fullUrl} → ${status} (${duration}ms)`);
      throw err;
    }
  }

  /** Concatenate baseURL + url defensively. */
  private static fullUrl(baseURL?: string, url?: string): string {
    if (!url) return baseURL ?? '/';
    if (url.startsWith('http')) return url;
    if (!baseURL) return url;
    return `${baseURL.replace(/\/+$/, '')}/${url.replace(/^\/+/, '')}`;
  }
}
