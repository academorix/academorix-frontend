/**
 * @file redaction-config.interface.ts
 * @module @stackra/logger/core/interfaces
 * @description Configuration interface for the redaction enricher.
 */

/**
 * Configuration for the redaction enricher.
 *
 * Controls which metadata fields are masked in log entries before
 * they reach reporters. Supports direct paths and wildcard patterns.
 */
export interface IRedactionConfig {
  /** Field paths to redact (supports wildcards like `*.secret`). */
  paths: string[];
  /** Replacement string for redacted values. Default: '***'. */
  mask?: string;
}
