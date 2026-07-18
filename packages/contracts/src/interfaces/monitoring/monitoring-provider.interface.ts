/**
 * @file monitoring-provider.interface.ts
 * @module @stackra/contracts/interfaces/monitoring
 * @description Contract implemented by every error-monitoring provider
 *   (Sentry, Bugsnag, console, …). Providers are the "drivers" of the
 *   monitoring system; the manager fans events out to all registered ones.
 */

/** Severity level for a captured event. */
export type MonitoringSeverity = "fatal" | "error" | "warning" | "info" | "debug";

/** Identity of the current user, attached to captured events. */
export interface IMonitoringUser {
  /** Stable user id. */
  id?: string;
  /** User email. */
  email?: string;
  /** Display / username. */
  username?: string;
  /** Arbitrary extra identity traits. */
  [key: string]: unknown;
}

/** A breadcrumb — a timestamped trail entry leading up to an error. */
export interface IMonitoringBreadcrumb {
  /** Human-readable message. */
  message: string;
  /** Logical category (e.g. `navigation`, `http`, `ui.click`). */
  category?: string;
  /** Severity of the breadcrumb. */
  level?: MonitoringSeverity;
  /** Epoch milliseconds; providers default to "now" when omitted. */
  timestamp?: number;
  /** Structured payload. */
  data?: Record<string, unknown>;
}

/** Contextual metadata attached to a capture call. */
export interface ICaptureContext {
  /** Severity override (defaults to `error` / `fatal`). */
  severity?: MonitoringSeverity;
  /** Indexed tags for filtering/grouping. */
  tags?: Record<string, string>;
  /** Non-indexed structured extra data. */
  extra?: Record<string, unknown>;
  /** React component stack (from an error boundary's `errorInfo`). */
  componentStack?: string;
  /** User identity to attach to this event. */
  user?: IMonitoringUser;
}

/**
 * A single monitoring destination. Only `name` + `captureException` are
 * required; everything else is optional so lightweight providers (e.g. a
 * console reporter) can implement a subset.
 */
export interface IMonitoringProvider {
  /** Unique provider name (e.g. `sentry`, `console`). */
  readonly name: string;

  /** One-time async initialisation (SDK boot). */
  init?(): void | Promise<void>;

  /** Report a caught exception. */
  captureException(error: Error, context?: ICaptureContext): void;

  /** Report a message-only event. */
  captureMessage?(message: string, context?: ICaptureContext): void;

  /** Append a breadcrumb to the trail. */
  addBreadcrumb?(breadcrumb: IMonitoringBreadcrumb): void;

  /** Bind (or clear, with `null`) the current user identity. */
  setUser?(user: IMonitoringUser | null): void;

  /** Flush any buffered events (call before unload / shutdown). */
  flush?(): Promise<void>;
}
