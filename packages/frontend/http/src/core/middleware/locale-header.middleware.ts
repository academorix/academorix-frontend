/**
 * @file locale-header.middleware.ts
 * @module @stackra/http/middleware
 * @description Injects the X-Language header from the current i18n locale
 *   into every outgoing HTTP request. Relies on `I18N_LOCALE_SERVICE` from
 *   `@stackra/contracts` to read the active locale. Requests can opt out
 *   via `meta.skipLocale: true`.
 */

import { Inject, Optional } from '@stackra/container';

import {
  I18N_LOCALE_SERVICE,
  type IHttpContext,
  type IHttpMiddleware,
  type IHttpNextFunction,
  type IHttpResponse,
  type II18nLocaleService,
} from '@stackra/contracts';

import { HttpMiddleware } from '../decorators/http-middleware.decorator';

/**
 * Locale header middleware.
 *
 * Reads the current locale from the i18n locale service and attaches it
 * as the `X-Language` header (and `Accept-Language` for standards compliance)
 * on outgoing requests. Skipped when no locale service is configured or when
 * the request opts out.
 *
 * Priority 16: runs alongside tenant header, after auth.
 *
 * @example
 * ```typescript
 * // Opt out for a specific request:
 * http.get('/api/translations', { meta: { skipLocale: true } });
 * ```
 */
@HttpMiddleware({ priority: 16, name: 'locale-header' })
export class LocaleHeaderMiddleware implements IHttpMiddleware {
  /**
   * @param localeService - Optional i18n locale service for reading current locale.
   */
  public constructor(
    @Optional() @Inject(I18N_LOCALE_SERVICE) private readonly localeService?: II18nLocaleService
  ) {}

  /**
   * Inject the X-Language and Accept-Language headers, then delegate.
   *
   * @param context - HTTP request context
   * @param next - Next handler in the middleware chain
   * @returns The HTTP response
   */
  public async handle(context: IHttpContext, next: IHttpNextFunction): Promise<IHttpResponse> {
    if (!this.localeService) {
      return next(context);
    }

    if (context.request.meta?.['skipLocale'] === true) {
      return next(context);
    }

    const locale = this.localeService.getLocale();
    if (locale) {
      context.request.headers = {
        ...context.request.headers,
        'X-Language': locale,
        'Accept-Language': locale,
      };
    }

    return next(context);
  }
}
