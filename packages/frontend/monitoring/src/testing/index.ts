/**
 * @file index.ts
 * @module @stackra/monitoring/testing
 * @description Test doubles for the monitoring system.
 */

import type {
  ICaptureContext,
  IMonitoringBreadcrumb,
  IMonitoringManager,
  IMonitoringProvider,
  IMonitoringUser,
} from "@stackra/contracts";

/** A recorded capture for assertions. */
export interface RecordedCapture {
  /** `exception` or `message`. */
  kind: "exception" | "message";
  /** The error (for `exception`) or message string (for `message`). */
  payload: Error | string;
  /** The context passed to the capture. */
  context?: ICaptureContext;
}

/**
 * In-memory monitoring manager for tests. Records every call so specs can
 * assert on captures, breadcrumbs, and the bound user.
 */
export class MockMonitoringManager implements IMonitoringManager {
  /** All recorded captures. */
  public readonly captures: RecordedCapture[] = [];

  /** All recorded breadcrumbs. */
  public readonly breadcrumbs: IMonitoringBreadcrumb[] = [];

  /** The currently bound user. */
  public user: IMonitoringUser | null = null;

  private readonly providers: IMonitoringProvider[] = [];

  public captureException(error: Error, context?: ICaptureContext): void {
    this.captures.push({ kind: "exception", payload: error, context });
  }

  public captureMessage(message: string, context?: ICaptureContext): void {
    this.captures.push({ kind: "message", payload: message, context });
  }

  public addBreadcrumb(breadcrumb: IMonitoringBreadcrumb): void {
    this.breadcrumbs.push(breadcrumb);
  }

  public setUser(user: IMonitoringUser | null): void {
    this.user = user;
  }

  public async flush(): Promise<void> {
    /* no-op */
  }

  public register(provider: IMonitoringProvider): void {
    this.providers.push(provider);
  }

  public getProviders(): readonly IMonitoringProvider[] {
    return this.providers;
  }
}

/** Create a fresh {@link MockMonitoringManager}. */
export function createMockMonitoringManager(): MockMonitoringManager {
  return new MockMonitoringManager();
}
