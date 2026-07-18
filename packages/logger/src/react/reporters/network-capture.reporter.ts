/**
 * @file network-capture.reporter.ts
 * @module @stackra/logger/react/reporters
 * @description Network error auto-capture reporter.
 *   Monkey-patches globalThis.fetch to intercept failed network requests
 *   and log them at WARN level. Enabled optionally via LoggerModule config.
 */

import { type ILogReporter, type ILogEntry, LogLevel } from "@stackra/contracts";
import { Reporter } from "@/core/decorators/reporter.decorator";
import { LoggerManager } from "@/core/services/logger-manager.service";

/**
 * Network capture reporter — intercepts failed fetch requests and logs them.
 *
 * When enabled, monkey-patches `globalThis.fetch` to detect:
 * - Network errors (fetch throws)
 * - HTTP errors (response.ok === false, status >= 400)
 *
 * Logs each failure at WARN level with request URL, method, and status code.
 * This reporter does not buffer entries — it directly dispatches to the manager.
 *
 * Enable via `LoggerModule.forRoot({ captureNetworkErrors: true })`.
 *
 * @example
 * ```typescript
 * // Enabled automatically when captureNetworkErrors is true
 * // Or manually:
 * const capture = new NetworkCaptureReporter();
 * capture.install();
 * ```
 */
@Reporter("network-capture")
export class NetworkCaptureReporter implements ILogReporter {
  /** Reporter identifier. */
  public readonly name = "network-capture";

  /** Original fetch reference (before patching). */
  private originalFetch: typeof globalThis.fetch | null = null;

  /** Whether the reporter has been installed. */
  private installed = false;

  /**
   * No-op write — this reporter captures errors proactively, not via write().
   *
   * @param _entry - Unused
   */
  public write(_entry: ILogEntry): void {
    // No-op — this reporter captures via fetch interception, not via write()
  }

  /**
   * Install the fetch interceptor.
   * Monkey-patches globalThis.fetch to capture network errors.
   * Safe to call multiple times (only installs once).
   */
  public install(): void {
    if (this.installed) return;
    if (typeof globalThis.fetch !== "function") return;

    this.originalFetch = globalThis.fetch;
    this.installed = true;

    const self = this;

    globalThis.fetch = async function patchedFetch(
      input: RequestInfo | URL,
      init?: RequestInit,
    ): Promise<Response> {
      const url = self.extractUrl(input);
      const method = init?.method ?? "GET";

      try {
        const response = await self.originalFetch!.call(globalThis, input, init);

        // Log non-OK responses at WARN level
        if (!response.ok) {
          self.logNetworkError(url, method, response.status, undefined);
        }

        return response;
      } catch (error: unknown) {
        // Log network errors (DNS failure, CORS, timeout, etc.)
        self.logNetworkError(url, method, 0, error);
        throw error; // Re-throw to preserve original behavior
      }
    };
  }

  /**
   * Uninstall the fetch interceptor and restore original fetch.
   */
  public uninstall(): void {
    if (!this.installed || !this.originalFetch) return;
    globalThis.fetch = this.originalFetch;
    this.originalFetch = null;
    this.installed = false;
  }

  /**
   * Flush — uninstalls the interceptor.
   *
   * @returns Promise that resolves immediately
   */
  public async flush(): Promise<void> {
    this.uninstall();
  }

  /**
   * Log a network error via the LoggerManager.
   *
   * @param url - Request URL
   * @param method - HTTP method
   * @param status - HTTP status code (0 for network errors)
   * @param error - Original error (if fetch threw)
   */
  private logNetworkError(url: string, method: string, status: number, error: unknown): void {
    const mgr = LoggerManager.instance;
    if (!mgr) return;

    const entry: ILogEntry = {
      level: LogLevel.WARN,
      message:
        status > 0
          ? `Network request failed: ${method} ${url} (${status})`
          : `Network request error: ${method} ${url}`,
      context: "NetworkCapture",
      timestamp: new Date().toISOString(),
      meta: {
        url,
        method,
        statusCode: status,
        errorMessage: error instanceof Error ? error.message : undefined,
      },
    };

    mgr.dispatch(entry);
  }

  /**
   * Extract the URL string from a fetch input.
   *
   * @param input - Request input (string, URL, or Request object)
   * @returns URL string
   */
  private extractUrl(input: RequestInfo | URL): string {
    if (typeof input === "string") return input;
    if (input instanceof URL) return input.toString();
    if (typeof input === "object" && "url" in input) return (input as any).url;
    return "unknown";
  }
}
