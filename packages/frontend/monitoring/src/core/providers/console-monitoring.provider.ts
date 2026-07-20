/**
 * @file console-monitoring.provider.ts
 * @module @stackra/monitoring/core/providers
 * @description Zero-dependency provider that reports to the console.
 *   Useful in development and as a fallback when no SDK is configured.
 */

import type {
  ICaptureContext,
  IMonitoringBreadcrumb,
  IMonitoringProvider,
  IMonitoringUser,
} from "@stackra/contracts";

/**
 * Console monitoring provider — prints captures with their context.
 */
export class ConsoleMonitoringProvider implements IMonitoringProvider {
  public readonly name = "console";

  private user: IMonitoringUser | null = null;

  /**
   * @param error - The captured exception.
   * @param context - Optional capture context.
   */
  public captureException(error: Error, context?: ICaptureContext): void {
    // eslint-disable-next-line no-console
    console.error("[monitoring] exception", error, this.enrich(context));
  }

  /**
   * @param message - The message to capture.
   * @param context - Optional capture context.
   */
  public captureMessage(message: string, context?: ICaptureContext): void {
    // eslint-disable-next-line no-console
    console.warn("[monitoring] message", message, this.enrich(context));
  }

  /**
   * @param breadcrumb - The breadcrumb to record.
   */
  public addBreadcrumb(breadcrumb: IMonitoringBreadcrumb): void {
    // eslint-disable-next-line no-console
    console.debug("[monitoring] breadcrumb", breadcrumb);
  }

  /**
   * @param user - The user identity, or `null` to clear.
   */
  public setUser(user: IMonitoringUser | null): void {
    this.user = user;
  }

  /** Merge the bound user into the context for logging. */
  private enrich(context?: ICaptureContext): ICaptureContext {
    return { ...context, user: context?.user ?? this.user ?? undefined };
  }
}
