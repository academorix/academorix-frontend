/**
 * @file sentry-monitoring.provider.ts
 * @module @stackra/monitoring/core/providers
 * @description Sentry provider. Loads `@sentry/browser` lazily (optional
 *   peer) so the package works without it installed.
 */

import type {
  ICaptureContext,
  IMonitoringBreadcrumb,
  IMonitoringProvider,
  IMonitoringUser,
  MonitoringSeverity,
} from '@stackra/contracts';

import type { ISentryProviderOptions } from '../interfaces';

/** Minimal structural view of the bits of `@sentry/browser` we use. */
interface SentryLike {
  init(options: Record<string, unknown>): void;
  captureException(error: unknown, hint?: Record<string, unknown>): void;
  captureMessage(message: string, level?: string): void;
  addBreadcrumb(breadcrumb: Record<string, unknown>): void;
  setUser(user: Record<string, unknown> | null): void;
  flush(timeout?: number): Promise<boolean>;
}

/** Map our severity vocabulary onto Sentry's. */
function toSentryLevel(severity: MonitoringSeverity | undefined): string {
  return severity ?? 'error';
}

/**
 * Sentry-backed monitoring provider.
 */
export class SentryMonitoringProvider implements IMonitoringProvider {
  public readonly name = 'sentry';

  private client: SentryLike | undefined;

  /**
   * @param options - Sentry provider configuration.
   * @param defaults - Module-level environment/release fallbacks.
   */
  public constructor(
    private readonly options: ISentryProviderOptions,
    private readonly defaults: { environment?: string; release?: string } = {}
  ) {}

  /** Lazily import and initialise the Sentry SDK. */
  public async init(): Promise<void> {
    // Variable specifier keeps TS from statically requiring the optional dep.
    const moduleName = '@sentry/browser';
    const mod = (await import(/* @vite-ignore */ moduleName).catch(() => undefined)) as
      SentryLike | undefined;

    if (!mod) {
      // eslint-disable-next-line no-console
      console.warn('[monitoring] @sentry/browser is not installed — Sentry provider disabled.');
      return;
    }

    mod.init({
      dsn: this.options.dsn,
      environment: this.options.environment ?? this.defaults.environment,
      release: this.options.release ?? this.defaults.release,
      tracesSampleRate: this.options.tracesSampleRate,
    });
    this.client = mod;
  }

  /**
   * @param error - The captured exception.
   * @param context - Optional capture context.
   */
  public captureException(error: Error, context?: ICaptureContext): void {
    this.client?.captureException(error, {
      tags: context?.tags,
      extra: {
        ...context?.extra,
        ...(context?.componentStack ? { componentStack: context.componentStack } : {}),
      },
      level: toSentryLevel(context?.severity),
    });
  }

  /**
   * @param message - The message to capture.
   * @param context - Optional capture context.
   */
  public captureMessage(message: string, context?: ICaptureContext): void {
    this.client?.captureMessage(message, toSentryLevel(context?.severity));
  }

  /**
   * @param breadcrumb - The breadcrumb to record.
   */
  public addBreadcrumb(breadcrumb: IMonitoringBreadcrumb): void {
    this.client?.addBreadcrumb({
      message: breadcrumb.message,
      category: breadcrumb.category,
      level: breadcrumb.level,
      timestamp: breadcrumb.timestamp,
      data: breadcrumb.data,
    });
  }

  /**
   * @param user - The user identity, or `null` to clear.
   */
  public setUser(user: IMonitoringUser | null): void {
    this.client?.setUser(user);
  }

  /** Flush buffered events (2s budget). */
  public async flush(): Promise<void> {
    await this.client?.flush(2000);
  }
}
