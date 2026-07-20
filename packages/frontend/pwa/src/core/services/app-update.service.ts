/**
 * @file app-update.service.ts
 * @module @stackra/pwa/core/services
 * @description Backend-published app-release polling + realtime
 *   subscription.
 *
 *   Distinct from {@link PwaService}'s SW update flow — this one
 *   handles the *app version* the backend advertises via
 *   `GET /api/v1/app/version` and the `app.updates` realtime channel.
 *
 *   Two boot phases:
 *   1. `onModuleInit` — one-shot `check()` when `checkOnBoot` is
 *      enabled, arm a poll interval when `pollingIntervalMs > 0`.
 *   2. `onApplicationBootstrap` — subscribe to the `app.updates`
 *      realtime channel when broadcasting is enabled (runs late so
 *      realtime module has finished wiring its connection).
 *
 *   Both HTTP and realtime peers are optional — the service degrades
 *   gracefully when either is absent. Apps can still drive checks
 *   manually via {@link check}.
 */

import {
  Inject,
  Injectable,
  Optional,
  type OnApplicationBootstrap,
  type OnModuleInit,
} from "@stackra/container";
import { Uri, retry } from "@stackra/support";
import {
  HTTP_MANAGER,
  LOGGER_MANAGER,
  REALTIME_MANAGER,
  type IHttpManager,
  type ILoggerManager,
  type IRealtimeManager,
} from "@stackra/contracts";

import { PWA_CONFIG, PWA_EVENTS } from "../constants";
import type {
  IAppUpdateConfig,
  IAppUpdateManifest,
  IAppUpdateState,
  IPwaModuleOptions,
} from "../interfaces";
import { AnalyticsBridgeService } from "./analytics-bridge.service";

/** Listener signature — receives no argument. */
export type AppUpdateListener = () => void;

/**
 * Default endpoint path — matches the Laravel `AppVersionController`
 * convention.
 */
const DEFAULT_ENDPOINT = "/api/v1/app/version";

/** Default realtime channel name — matches Laravel's `AppUpdateEvent`. */
const DEFAULT_CHANNEL = "app.updates";

/**
 * App-update reactive service.
 *
 * @example
 * ```typescript
 * PwaModule.forRoot({
 *   appUpdate: {
 *     currentVersion: import.meta.env.APP_VERSION,
 *     pollingIntervalMs: 60 * 60 * 1000,
 *     broadcasting: { enabled: true },
 *   },
 * })
 * ```
 */
@Injectable()
export class AppUpdateService implements OnModuleInit, OnApplicationBootstrap {
  /** Current reactive state — swapped on every mutation. */
  private state: IAppUpdateState;

  /** Poll-interval handle (populated when polling is enabled). */
  private pollHandle: ReturnType<typeof setInterval> | null = null;

  /** Cleanup functions for realtime subscriptions. */
  private readonly cleanups: Array<() => void> = [];

  /** Registered snapshot listeners. */
  private readonly listeners = new Set<AppUpdateListener>();

  /** The `appUpdate` config slice, extracted lazily so unset config
   * short-circuits every method. */
  private get appUpdate(): IAppUpdateConfig {
    return this.config.appUpdate ?? {};
  }

  public constructor(
    @Inject(PWA_CONFIG) private readonly config: IPwaModuleOptions,
    @Optional() @Inject(HTTP_MANAGER) private readonly httpManager?: IHttpManager,
    @Optional()
    @Inject(REALTIME_MANAGER)
    private readonly realtimeManager?: IRealtimeManager,
    @Optional()
    @Inject(LOGGER_MANAGER)
    private readonly logger?: ILoggerManager,
    @Optional() private readonly analytics?: AnalyticsBridgeService,
  ) {
    // Prime the state with the current version so first-render UI
    // can display it before any check completes.
    this.state = {
      hasUpdate: false,
      current: this.appUpdate.currentVersion,
      latest: undefined,
      mandatory: false,
      downloadUrl: undefined,
      releaseNotesUrl: undefined,
      checkedAt: undefined,
      isChecking: false,
      error: null,
    };
  }

  // ══════════════════════════════════════════════════════════════
  // Lifecycle
  // ══════════════════════════════════════════════════════════════

  /**
   * Boot-time hook.
   * - Fire the initial `check()` when `checkOnBoot !== false`.
   * - Arm the polling interval when configured.
   *
   * The initial check is **fire-and-forget** — awaiting it here would
   * block the module tree while the HTTP client retries against a
   * potentially-slow or unreachable endpoint. `check()` is already
   * fail-soft internally (errors settle on `state.error`), so
   * dispatching without awaiting is safe.
   */
  public onModuleInit(): void {
    if (this.appUpdate.checkOnBoot !== false) {
      // Fire and forget — never blocks boot. Errors are captured by
      // check()'s internal try/catch and surface on state.error.
      void this.check();
    }

    const interval = this.appUpdate.pollingIntervalMs ?? 0;
    if (interval > 0) {
      // Same treatment for the poll — always fire and forget.
      this.pollHandle = setInterval(() => void this.check(), interval);
    }
  }

  /**
   * Late boot hook — subscribe to the realtime channel AFTER every
   * other module has settled so `REALTIME_MANAGER` is fully wired.
   */
  public async onApplicationBootstrap(): Promise<void> {
    if (!this.appUpdate.broadcasting?.enabled) return;

    if (!this.realtimeManager) {
      this.warn("appUpdate.broadcasting.enabled is true but @stackra/realtime is not installed.");
      return;
    }

    try {
      const connection = await this.realtimeManager.connection(
        this.appUpdate.broadcasting.connection,
      );
      const channelName = this.appUpdate.broadcasting.channel ?? DEFAULT_CHANNEL;
      const channel = connection.channel(channelName);

      const listener = (payload: unknown): void => {
        this.applyManifest(payload as IAppUpdateManifest, "broadcast");
      };

      // The Laravel `AppUpdateEvent` broadcasts under the event name
      // `.app.updates` (leading dot = "any namespace") — subscribe
      // to both the raw name and the canonical dot-prefixed variant
      // so we work with either broadcaster shape.
      channel.on("app.updates", listener);
      channel.on(".app.updates", listener);

      this.cleanups.push(() => channel.off("app.updates", listener));
      this.cleanups.push(() => channel.off(".app.updates", listener));
    } catch (error) {
      this.warn("Failed to subscribe to app.updates channel.", error);
    }
  }

  // ══════════════════════════════════════════════════════════════
  // Public API
  // ══════════════════════════════════════════════════════════════

  /**
   * Fetch the latest release manifest from the backend and merge
   * into local state. Safe to call any time — no-ops when the HTTP
   * peer isn't installed.
   */
  public async check(): Promise<void> {
    if (!this.httpManager) {
      this.warn("AppUpdateService.check() called but @stackra/http is not installed.");
      return;
    }

    this.state = { ...this.state, isChecking: true, error: null };
    this.emit();

    try {
      const client = await this.httpManager.connection(this.appUpdate.httpClient);
      const url = this.buildVersionUrl();
      const manifest = await retry(async () => {
        const res = await client.get<IAppUpdateManifest>(url);
        return res.data;
      });

      this.applyManifest(manifest, "poll");
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      this.state = { ...this.state, isChecking: false, error: err };
      this.analytics?.emit(PWA_EVENTS.APP_UPDATE_CHECK_FAILED, {
        error: err.message,
      });
      this.emit();
      this.warn("AppUpdateService.check() failed.", err);
    }
  }

  /**
   * User accepted the update. Emits the accepted event and opens
   * the platform download URL in a new tab (when a URL is
   * available). Callers who want custom handling should pass
   * `openWindow: false` and drive the navigation themselves.
   */
  public accept(options: { readonly openWindow?: boolean } = {}): void {
    const openWindow = options.openWindow ?? true;
    this.analytics?.emit(PWA_EVENTS.APP_UPDATE_ACCEPTED, {
      current: this.state.current,
      latest: this.state.latest,
      mandatory: this.state.mandatory,
    });

    if (openWindow && this.state.downloadUrl && typeof window !== "undefined") {
      window.open(this.state.downloadUrl, "_blank", "noopener,noreferrer");
    }
  }

  /**
   * User dismissed the update toast for the session. Non-mandatory
   * dismissals only — a mandatory update stays `hasUpdate: true` so
   * apps can block navigation until the user acts.
   */
  public dismiss(): void {
    if (this.state.mandatory) return;
    this.state = { ...this.state, hasUpdate: false };
    this.analytics?.emit(PWA_EVENTS.APP_UPDATE_DISMISSED);
    this.emit();
  }

  /** Current reactive state. */
  public getState(): IAppUpdateState {
    return this.state;
  }

  /** Subscribe to state changes; returns an unsubscribe function. */
  public subscribe(listener: AppUpdateListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Stop polling + drop realtime subscriptions. Called by tests
   * (and any consumer that manages lifecycle explicitly).
   */
  public destroy(): void {
    if (this.pollHandle != null) {
      clearInterval(this.pollHandle);
      this.pollHandle = null;
    }
    for (const cleanup of this.cleanups) {
      try {
        cleanup();
      } catch {
        // fail-soft
      }
    }
    this.cleanups.length = 0;
  }

  // ══════════════════════════════════════════════════════════════
  // Private
  // ══════════════════════════════════════════════════════════════

  /**
   * Merge a wire-shaped manifest into the reactive state.
   *
   * @param manifest - Raw payload (either poll response or
   *   broadcast event data).
   * @param source - Where the manifest came from — recorded on the
   *   analytics event to make dashboards distinguish polling from
   *   push signal.
   */
  private applyManifest(manifest: IAppUpdateManifest, source: "poll" | "broadcast"): void {
    if (!manifest || typeof manifest !== "object") {
      // Defensive — broadcast payloads can arrive malformed.
      return;
    }

    const platform = this.appUpdate.platform ?? "web";
    const downloadUrl = pickDownloadUrl(manifest, platform);
    const availableFlag = pickAvailableFlag(manifest, platform);
    const latest = manifest.current_version;
    const current = this.state.current;

    // A version bump is considered "available" when EITHER:
    //   1. The server sets the platform-specific `*_update_available` flag, OR
    //   2. The `current_version` differs from our build's version.
    //
    // Fallback to (2) preserves compatibility with servers that
    // don't ship the availability flags.
    const hasUpdate =
      typeof availableFlag === "boolean"
        ? availableFlag
        : latest !== undefined && current !== undefined && latest !== current;

    this.state = {
      hasUpdate,
      current,
      latest,
      mandatory: manifest.mandatory === true,
      downloadUrl,
      releaseNotesUrl: manifest.release_notes_url,
      checkedAt: new Date().toISOString(),
      isChecking: false,
      error: null,
    };

    if (hasUpdate) {
      this.analytics?.emit(PWA_EVENTS.APP_UPDATE_AVAILABLE, {
        current,
        latest,
        mandatory: this.state.mandatory,
        source,
      });
    } else {
      this.analytics?.emit(PWA_EVENTS.APP_UPDATE_CHECK_UP_TO_DATE, {
        current,
        latest,
      });
    }

    this.emit();
  }

  /** Build the absolute version-check URL from config. */
  private buildVersionUrl(): string {
    const path = this.appUpdate.endpoints?.version ?? DEFAULT_ENDPOINT;
    if (!this.appUpdate.baseUrl) return path;
    return Uri.of(this.appUpdate.baseUrl).path(path).toString();
  }

  /** Fan out to every subscriber. */
  private emit(): void {
    for (const listener of this.listeners) {
      try {
        listener();
      } catch {
        // fail-soft — a broken listener never breaks the rest.
      }
    }
  }

  /** Warn through the optional logger, fail-soft. */
  private warn(message: string, cause?: unknown): void {
    if (!this.logger) return;
    try {
      const suffix = cause ? `: ${String(cause)}` : "";
      this.logger.create("pwa.app-update").warn(`${message}${suffix}`);
    } catch {
      // fail-soft
    }
  }
}

// ══════════════════════════════════════════════════════════════════
// Helpers
// ══════════════════════════════════════════════════════════════════

/** Pick the platform-specific download URL from a manifest. */
function pickDownloadUrl(
  manifest: IAppUpdateManifest,
  platform: "web" | "desktop" | "mobile",
): string | undefined {
  switch (platform) {
    case "desktop":
      return manifest.desktop_update_url;
    case "mobile":
      return manifest.mobile_update_url;
    default:
      return manifest.web_update_url;
  }
}

/** Pick the platform-specific availability flag from a manifest. */
function pickAvailableFlag(
  manifest: IAppUpdateManifest,
  platform: "web" | "desktop" | "mobile",
): boolean | undefined {
  switch (platform) {
    case "desktop":
      return manifest.desktop_update_available;
    case "mobile":
      return manifest.mobile_update_available;
    default:
      return manifest.web_update_available;
  }
}
