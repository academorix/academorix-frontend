/**
 * @file reporter.decorator.ts
 * @module @stackra/decorators/logger
 *
 * @description
 * The `@Reporter('name')` class decorator — marks a class as a
 * discoverable log reporter.
 *
 * Stamps the reporter name under `LOGGER_REPORTER_METADATA_KEY` and
 * applies `@Injectable()`. The `LoggerManager` reads the metadata
 * at bootstrap via
 * `discovery.getProvidersByMetadata(LOGGER_REPORTER_METADATA_KEY)`
 * and registers each discovered instance by name.
 */

import { LOGGER_REPORTER_METADATA_KEY } from "@stackra/contracts";

import { createDiscoverableClassDecorator, createMetadataReader } from "../core";

/**
 * Mark a class as a discoverable log reporter.
 *
 * @param name Unique reporter identifier (e.g. `'console'`,
 *   `'json'`, `'datadog'`).
 * @returns A `ClassDecorator` that stamps the reporter name and
 *   applies `@Injectable()`.
 *
 * @example
 * ```typescript
 * import { Reporter } from '@stackra/decorators/logger';
 * import type { ILogReporter } from '@stackra/contracts';
 *
 * @Reporter('datadog')
 * export class DatadogReporter implements ILogReporter {
 *   public readonly name = 'datadog';
 *   public write(entry: ILogEntry): void { … }
 * }
 * ```
 */
export const Reporter = createReporterDecorator();

/**
 * Reader for `@Reporter(...)` metadata.
 *
 * @example
 * ```typescript
 * const reporterName = reporterMetadata.get(SomeClass);
 * ```
 */
export const reporterMetadata = createMetadataReader<string>(LOGGER_REPORTER_METADATA_KEY);

/**
 * Internal — builds the concrete decorator. Wrapped in a factory so
 * we can pass a `normalizeOptions` that turns the caller's positional
 * `name` argument into the stamped payload (a plain string).
 *
 * `@Reporter` accepts a raw `name: string`, but the underlying
 * factory expects a single `options` argument. We hand-roll the
 * signature bridge here so consumers keep the natural
 * `@Reporter('datadog')` calling convention.
 */
function createReporterDecorator(): (name: string) => ClassDecorator {
  const base = createDiscoverableClassDecorator<string>(LOGGER_REPORTER_METADATA_KEY);
  return (name: string) => base(name);
}
