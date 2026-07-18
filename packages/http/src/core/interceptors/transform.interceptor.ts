/**
 * Transform interceptor.
 *
 * Bridges TypeScript-style camelCase to API-style snake_case (and
 * back) and serializes/parses Date objects on the wire. Custom
 * per-endpoint transforms run before the case/date passes.
 *
 * @module @stackra/http/interceptors/transform
 */

import { Inject } from '@stackra/container';
import { Logger } from '@stackra/logger';

import {
  HTTP_CONFIG,
  type IHttpContext,
  type IHttpInterceptor,
  type IHttpModuleOptions,
  type IHttpNextFunction,
  type IHttpRequestConfig,
  type IHttpResponse,
} from '@stackra/contracts';

import { HttpInterceptor } from '../decorators/http-interceptor.decorator';
import { HttpTransformError } from '../errors';
import { CaseConverter, DateParser } from '../utils';

/**
 * Transform interceptor.
 */
@HttpInterceptor({ priority: 70, name: 'transform' })
export class TransformInterceptor implements IHttpInterceptor {
  /** Scoped logger. */
  private readonly logger = new Logger(TransformInterceptor.name);

  /**
   * @param config - Module options.
   */
  public constructor(@Inject(HTTP_CONFIG) private readonly config: IHttpModuleOptions) {}

  /** @inheritdoc */
  public async intercept(context: IHttpContext, next: IHttpNextFunction): Promise<IHttpResponse> {
    const transformConfig = this.config.connections[this.config.default]?.transform;
    if (!transformConfig?.enabled) return next(context);
    if (context.request.meta?.['skipTransform'] === true) return next(context);

    if (context.request.data !== undefined && transformConfig.requestTransform) {
      try {
        context.request.data = this.transformRequest(context.request);
      } catch (err: Error | any) {
        this.logger.error('request transform failed', {
          error: err instanceof Error ? err.message : String(err),
        });
      }
    }

    const response = await next(context);

    if (response.data !== undefined && transformConfig.responseTransform) {
      try {
        (response as { data: unknown }).data = this.transformResponse(
          context.request,
          response.data
        );
      } catch (err: Error | any) {
        this.logger.error('response transform failed', {
          error: err instanceof Error ? err.message : String(err),
        });
      }
    }

    return response;
  }

  /** Pre-handler request transform. */
  private transformRequest(request: IHttpRequestConfig): unknown {
    const transformConfig = this.config.connections[this.config.default]?.transform;
    let value: unknown = request.data;

    const endpoint = `${request.method ?? 'GET'}:${request.url ?? ''}`;
    const customRequest = transformConfig?.customTransforms?.[endpoint]?.request;
    if (customRequest) {
      try {
        value = customRequest(value);
      } catch (err: Error | any) {
        throw new HttpTransformError(
          `Custom request transform failed for ${endpoint}: ${(err as Error).message}`,
          value
        );
      }
    }

    if (transformConfig?.caseConversion?.request === 'snake_case') {
      try {
        value = CaseConverter.toSnakeCase(value);
      } catch (err: Error | any) {
        throw new HttpTransformError(
          `camelCase → snake_case failed: ${(err as Error).message}`,
          value
        );
      }
    }

    if (transformConfig?.dateHandling?.serializeDates) {
      try {
        value = DateParser.serializeDates(value);
      } catch (err: Error | any) {
        throw new HttpTransformError(`Date serialization failed: ${(err as Error).message}`, value);
      }
    }

    return value;
  }

  /** Post-handler response transform. */
  private transformResponse(request: IHttpRequestConfig, data: unknown): unknown {
    const transformConfig = this.config.connections[this.config.default]?.transform;
    let value = data;

    const endpoint = `${request.method ?? 'GET'}:${request.url ?? ''}`;
    const customResponse = transformConfig?.customTransforms?.[endpoint]?.response;
    if (customResponse) {
      try {
        value = customResponse(value);
      } catch (err: Error | any) {
        throw new HttpTransformError(
          `Custom response transform failed for ${endpoint}: ${(err as Error).message}`,
          value
        );
      }
    }

    if (transformConfig?.caseConversion?.response === 'camelCase') {
      try {
        value = CaseConverter.toCamelCase(value);
      } catch (err: Error | any) {
        throw new HttpTransformError(
          `snake_case → camelCase failed: ${(err as Error).message}`,
          value
        );
      }
    }

    if (transformConfig?.dateHandling?.parseDates) {
      try {
        value = DateParser.parseDates(value);
      } catch (err: Error | any) {
        throw new HttpTransformError(`Date parsing failed: ${(err as Error).message}`, value);
      }
    }

    return value;
  }
}
