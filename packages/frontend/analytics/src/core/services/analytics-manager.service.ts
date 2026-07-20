/**
 * @file analytics-manager.service.ts
 * @module @stackra/analytics/core/services
 * @description Consent-gated, fan-out analytics manager built on
 *   `MultipleInstanceManager`.
 *
 *   Named provider instances come from config (`providers` map, resolved by
 *   the `create{Driver}Driver` convention like cache/queue). Fan-out
 *   dispatches every `track`/`page`/`identify` to the active set — the
 *   configured `stack` (default: all) plus ad-hoc providers — but only to
 *   providers whose declared consent category is currently granted. Events
 *   emitted before consent are buffered (bounded) and replayed per-provider
 *   as categories are granted. Providers init eagerly in
 *   `onApplicationBootstrap`.
 */

import { Inject, Injectable, Optional, OnApplicationBootstrap } from "@stackra/container";
import { MultipleInstanceManager } from "@stackra/support";
import { ANALYTICS_CONFIG, LOGGER_MANAGER } from "@stackra/contracts";
import type {
  IAnalyticsEvent,
  IAnalyticsIdentity,
  IAnalyticsManager,
  IAnalyticsPageView,
  IAnalyticsProvider,
  ILoggerManager,
} from "@stackra/contracts";

import type {
  IAnalyticsModuleOptions,
  IConsentGate,
  IGa4ProviderOptions,
  IPixelProviderOptions,
} from "../interfaces";
import { CONSENT_MANAGER_TOKEN } from "../constants";
import { ConsoleAnalyticsProvider } from "../providers/console-analytics.provider";
import { Ga4AnalyticsProvider } from "../providers/ga4-analytics.provider";
import { MetaPixelProvider } from "../providers/meta-pixel.provider";
import { TiktokPixelProvider } from "../providers/tiktok-pixel.provider";
import { SnapchatPixelProvider } from "../providers/snapchat-pixel.provider";

/** A queued analytics call awaiting consent. */
type QueuedCall =
  | { kind: "track"; event: IAnalyticsEvent }
  | { kind: "page"; view: IAnalyticsPageView }
  | { kind: "identify"; identity: IAnalyticsIdentity };

/** A buffered call bound to the provider it targets. */
interface BufferedEntry {
  provider: IAnalyticsProvider;
  call: QueuedCall;
}

/**
 * The analytics manager — a `MultipleInstanceManager` of providers with a
 * consent-gated fan-out facade on top.
 */
@Injectable()
export class AnalyticsManager
  extends MultipleInstanceManager<IAnalyticsProvider>
  implements IAnalyticsManager, OnApplicationBootstrap
{
  /** Providers registered imperatively (decorator/loader/forFeature). */
  private readonly adhoc: IAnalyticsProvider[] = [];

  private buffer: BufferedEntry[] = [];

  private identity: IAnalyticsIdentity | undefined;

  private unsubscribe?: () => void;

  /**
   * @param config - Merged analytics configuration.
   * @param consent - Optional consent gate (decoupled via `Symbol.for`).
   * @param loggerManager - Optional logger for internal warnings.
   */
  public constructor(
    @Inject(ANALYTICS_CONFIG) private readonly config: IAnalyticsModuleOptions,
    @Optional() @Inject(CONSENT_MANAGER_TOKEN) private readonly consent?: IConsentGate,
    @Optional() @Inject(LOGGER_MANAGER) private readonly loggerManager?: ILoggerManager,
  ) {
    super();
  }

  // ══════════════════════════════════════════════════════════════════════════
  // MultipleInstanceManager contract
  // ══════════════════════════════════════════════════════════════════════════

  public getDefaultInstance(): string {
    return this.config.default ?? Object.keys(this.config.providers ?? {})[0] ?? "console";
  }

  public setDefaultInstance(name: string): void {
    this.config.default = name;
  }

  public getInstanceConfig(name: string): Record<string, unknown> | null {
    return this.config.providers?.[name] ?? null;
  }

  /** Built-in `console` driver. */
  protected createConsoleDriver(): IAnalyticsProvider {
    return new ConsoleAnalyticsProvider();
  }

  /** Built-in `ga4` driver. */
  protected createGa4Driver(config: Record<string, unknown>): IAnalyticsProvider {
    return new Ga4AnalyticsProvider(config as unknown as IGa4ProviderOptions);
  }

  /** Built-in `meta-pixel` driver. */
  protected createMetaPixelDriver(config: Record<string, unknown>): IAnalyticsProvider {
    return new MetaPixelProvider(config as unknown as IPixelProviderOptions);
  }

  /** Built-in `tiktok-pixel` driver. */
  protected createTiktokPixelDriver(config: Record<string, unknown>): IAnalyticsProvider {
    return new TiktokPixelProvider(config as unknown as IPixelProviderOptions);
  }

  /** Built-in `snapchat-pixel` driver. */
  protected createSnapchatPixelDriver(config: Record<string, unknown>): IAnalyticsProvider {
    return new SnapchatPixelProvider(config as unknown as IPixelProviderOptions);
  }

  // ══════════════════════════════════════════════════════════════════════════
  // Lifecycle — eager init + consent subscription
  // ══════════════════════════════════════════════════════════════════════════

  public async onApplicationBootstrap(): Promise<void> {
    await Promise.all(
      this.configuredProviders().map((provider) =>
        Promise.resolve()
          .then(() => provider.init?.())
          .catch((error) => this.warn(`provider "${provider.name}" init failed`, error)),
      ),
    );

    // Replay buffered events as consent categories are granted.
    this.unsubscribe = this.consent?.subscribe?.(() => this.flushBuffer());
    this.flushBuffer();
  }

  // ══════════════════════════════════════════════════════════════════════════
  // IAnalyticsManager — fan-out facade
  // ══════════════════════════════════════════════════════════════════════════

  /**
   * Register an ad-hoc provider (idempotent by name); triggers async
   * `init()`. Used by the discovery loader and `forFeature`.
   *
   * @param provider - The provider to add.
   */
  public register(provider: IAnalyticsProvider): void {
    if (this.adhoc.some((p) => p.name === provider.name)) return;
    this.adhoc.push(provider);

    Promise.resolve()
      .then(() => provider.init?.())
      .then(() => {
        if (this.identity && this.allowed(provider)) {
          this.apply(provider, { kind: "identify", identity: this.identity });
        }
        this.flushBuffer();
      })
      .catch((error) => this.warn(`provider "${provider.name}" init failed`, error));
  }

  /** Every provider that fan-out currently targets. */
  public getProviders(): readonly IAnalyticsProvider[] {
    return this.activeProviders();
  }

  /**
   * Named access to a single provider — a configured instance or an
   * ad-hoc one.
   *
   * @param name - Instance/provider name.
   * @returns The provider, or `undefined` if unknown.
   */
  public provider(name: string): IAnalyticsProvider | undefined {
    if (this.getInstanceConfig(name)) return this.safeInstance(name);
    return this.adhoc.find((p) => p.name === name);
  }

  public track(name: string, properties?: Record<string, unknown>): void {
    this.dispatch({ kind: "track", event: { name, properties } });
  }

  public page(view: IAnalyticsPageView): void {
    this.dispatch({ kind: "page", view });
  }

  public identify(userId: string, traits?: Record<string, unknown>): void {
    this.identity = { userId, traits };
    this.dispatch({ kind: "identify", identity: this.identity });
  }

  public reset(): void {
    this.identity = undefined;
    for (const provider of this.activeProviders()) {
      this.safe(provider, () => provider.reset?.());
    }
  }

  // ══════════════════════════════════════════════════════════════════════════
  // Internal
  // ══════════════════════════════════════════════════════════════════════════

  /** Instance names that receive fan-out. */
  private stackNames(): string[] {
    return this.config.stack ?? Object.keys(this.config.providers ?? {});
  }

  /** Resolve the configured stack instances (safe). */
  private configuredProviders(): IAnalyticsProvider[] {
    const result: IAnalyticsProvider[] = [];
    for (const name of this.stackNames()) {
      const provider = this.safeInstance(name);
      if (provider) result.push(provider);
    }
    return result;
  }

  /** Configured stack instances ∪ ad-hoc providers, deduped by name. */
  private activeProviders(): IAnalyticsProvider[] {
    const result: IAnalyticsProvider[] = [];
    const seen = new Set<string>();
    for (const provider of [...this.configuredProviders(), ...this.adhoc]) {
      if (seen.has(provider.name)) continue;
      seen.add(provider.name);
      result.push(provider);
    }
    return result;
  }

  /** Resolve a named instance, swallowing resolution errors. */
  private safeInstance(name: string): IAnalyticsProvider | undefined {
    try {
      return this.instance(name);
    } catch (error) {
      this.warn(`failed to resolve provider "${name}"`, error);
      return undefined;
    }
  }

  /** Dispatch a call to each active provider, gating/buffering by consent. */
  private dispatch(call: QueuedCall): void {
    for (const provider of this.activeProviders()) {
      if (this.allowed(provider)) {
        this.apply(provider, call);
      } else if (this.config.bufferUntilConsent !== false) {
        this.enqueue(provider, call);
      }
    }
  }

  /** Whether a provider may fire given current consent. */
  private allowed(provider: IAnalyticsProvider): boolean {
    if (!provider.consentCategory) return true;
    if (this.consent) return this.consent.hasConsent(provider.consentCategory);
    return this.config.requireConsent === false;
  }

  /** Apply a queued call to a single provider. */
  private apply(provider: IAnalyticsProvider, call: QueuedCall): void {
    this.safe(provider, () => {
      switch (call.kind) {
        case "track":
          provider.track(call.event);
          break;
        case "page":
          provider.page?.(call.view);
          break;
        case "identify":
          provider.identify?.(call.identity);
          break;
      }
    });
  }

  /** Buffer a call for later replay, bounded by `bufferLimit`. */
  private enqueue(provider: IAnalyticsProvider, call: QueuedCall): void {
    const limit = this.config.bufferLimit ?? 100;
    this.buffer.push({ provider, call });
    if (this.buffer.length > limit) this.buffer.shift();
  }

  /** Replay buffered calls whose provider is now consented. */
  private flushBuffer(): void {
    if (this.buffer.length === 0) return;
    const remaining: BufferedEntry[] = [];
    for (const entry of this.buffer) {
      if (this.allowed(entry.provider)) {
        this.apply(entry.provider, entry.call);
      } else {
        remaining.push(entry);
      }
    }
    this.buffer = remaining;
  }

  /** Run a provider call, swallowing (and logging) any throw. */
  private safe(provider: IAnalyticsProvider, fn: () => void): void {
    try {
      fn();
    } catch (error) {
      this.warn(`provider "${provider.name}" threw`, error);
    }
  }

  /** Internal warning via the optional logger. */
  private warn(message: string, error: unknown): void {
    if (!this.loggerManager) return;
    try {
      this.loggerManager.create("analytics").warn(`${message}: ${String(error)}`);
    } catch {
      /* never let internal logging throw */
    }
    void this.unsubscribe;
  }
}
