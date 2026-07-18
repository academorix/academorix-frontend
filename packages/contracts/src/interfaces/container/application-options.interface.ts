/**
 * @file application-options.interface.ts
 * @module @stackra/contracts/interfaces/container
 * @description Full configuration for Application.create() bootstrap.
 *   Extends beyond what @stackra/contracts provides — adds our production concerns.
 */

/**
 * Full configuration for Application.create() bootstrap.
 *
 * Our production bootstrap options — covers security, performance, CORS,
 * logging, timeouts, and more. Does not extend NestApplicationOptions to
 * avoid type conflicts.
 */
export interface IApplicationOptions {
  /** Application name (shown in logs). */
  name?: string;
  /** Port to listen on. Default: 3000. */
  port?: number;
  /** Host to bind to. Default: '0.0.0.0'. */
  host?: string;
  /** Global route prefix (e.g., 'api'). */
  prefix?: string;
  /** Routes excluded from the global prefix. */
  prefixExclude?: string[];
  /** Helmet security headers. Default: true. */
  helmet?: boolean | Record<string, unknown>;
  /** CORS configuration. Default: true. */
  cors?: boolean | Record<string, unknown>;
  /** Cookie parser secret. */
  cookieSecret?: string;
  /** Enable cookie parser. Default: true. */
  cookieParser?: boolean;
  /** Trust proxy setting. */
  trustProxy?: boolean | number | string;
  /** Response compression. Default: true. */
  compression?: boolean | Record<string, unknown>;
  /** Maximum request body size. Default: '10mb'. */
  bodyLimit?: string;
  /** Enable raw body for webhook signatures. Default: false. */
  rawBody?: boolean | string[];
  /** Enable X-Request-ID. Default: true. */
  requestId?: boolean;
  /** Enable X-Correlation-ID. Default: true. */
  correlationId?: boolean;
  /** Global request timeout in ms. Default: 30000. */
  timeout?: number;
  /** Wrap responses in envelope. Default: false. */
  responseEnvelope?: boolean;
  /** Enable HTTP request logging. Default: true. */
  requestLogging?: boolean;
  /** Trim whitespace from string inputs. Default: true. */
  trimStrings?: boolean;
  /** Strip HTML tags from inputs. Default: false. */
  stripHtml?: boolean;
}
