/**
 * @file monitoring-manager.service.ts
 * @module @stackra/monitoring/core/services
 * @description Fan-out monitoring manager built on `MultipleInstanceManager`.
 *
 *   Named provider instances come from config (`providers` map, resolved by
 *   the `create{Driver}Driver` convention like cache/queue). Fan-out
 *   dispatches every capture/breadcrumb/user call to the active set — the
 *   configured `stack` (default: all configured instances) plus any
 *   ad-hoc providers registered via the decorator/loader or `forFeature`.
 *   Providers are eagerly initialised in `onApplicationBootstrap`. A
 *   throwing provider is isolated.
 */

import { Inject, Injectable, Optional, OnApplicationBootstrap } from '@stackra/container';
import { MultipleInstanceManager } from '@stackra/support';
import { MONITORING_CONFIG, LOGGER_MANAGER } from '@stackra/contracts';
import type {
  ICaptureContext,
  ILoggerManager,
  IMonitoringBreadcrumb,
  IMonitoringManager,
  IMonitoringProvider,
  IMonitoringUser,
} from '@stackra/contracts';

import type { IMonitoringModuleOptions, ISentryProviderOptions } from '../interfaces';
import { ConsoleMonitoringProvider } from '../providers/console-monitoring.provider';
import { SentryMonitoringProvider } from '../providers/sentry-monitoring.provider';

/**
 * The monitoring manager — a `MultipleInstanceManager` of providers with a
 * fan-out facade on top.
 */
@Injectable()
export class MonitoringManager
  extends MultipleInstanceManager<IMonitoringProvider>
  implements IMonitoringManager, OnApplicationBootstrap
{
  /** Providers registered imperatively (decorator/loader/forFeature). */
  private readonly adhoc: IMonitoringProvider[] = [];

  private user: IMonitoringUser | null = null;

  /**
   * @param config - Merged monitoring configuration.
   * @param loggerManager - Optional logger for internal warnings.
   */
  public constructor(
    @Inject(MONITORING_CONFIG) private readonly config: IMonitoringModuleOptions,
    @Optional() @Inject(LOGGER_MANAGER) private readonly loggerManager?: ILoggerManager
  ) {
    super();
  }

  // ══════════════════════════════════════════════════════════════════════════
  // MultipleInstanceManager contract
  // ══════════════════════════════════════════════════════════════════════════

  public getDefaultInstance(): string {
    return this.config.default ?? Object.keys(this.config.providers ?? {})[0] ?? 'console';
  }

  public setDefaultInstance(name: string): void {
    this.config.default = name;
  }

  public getInstanceConfig(name: string): Record<string, unknown> | null {
    return this.config.providers?.[name] ?? null;
  }

  /** Built-in `console` driver. */
  protected createConsoleDriver(): IMonitoringProvider {
    return new ConsoleMonitoringProvider();
  }

  /** Built-in `sentry` driver. */
  protected createSentryDriver(config: Record<string, unknown>): IMonitoringProvider {
    return new SentryMonitoringProvider(config as unknown as ISentryProviderOptions, {
      environment: this.config.environment,
      release: this.config.release,
    });
  }

  // ══════════════════════════════════════════════════════════════════════════
  // Lifecycle — eager init of the active providers
  // ══════════════════════════════════════════════════════════════════════════

  public async onApplicationBootstrap(): Promise<void> {
    await Promise.all(
      this.configuredProviders().map((provider) =>
        Promise.resolve()
          .then(() => provider.init?.())
          .catch((error) => this.warn(`provider "${provider.name}" init failed`, error))
      )
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  // IMonitoringManager — fan-out facade
  // ══════════════════════════════════════════════════════════════════════════

  /**
   * Register an ad-hoc provider (idempotent by name); triggers async
   * `init()`. Used by the discovery loader and `forFeature`.
   *
   * @param provider - The provider to add.
   */
  public register(provider: IMonitoringProvider): void {
    if (this.adhoc.some((p) => p.name === provider.name)) return;
    this.adhoc.push(provider);

    if (this.user) this.safe(provider, () => provider.setUser?.(this.user));

    Promise.resolve()
      .then(() => provider.init?.())
      .catch((error) => this.warn(`provider "${provider.name}" init failed`, error));
  }

  /** Every provider that fan-out currently targets. */
  public getProviders(): readonly IMonitoringProvider[] {
    return this.activeProviders();
  }

  /**
   * Named access to a single provider — a configured instance or an
   * ad-hoc one.
   *
   * @param name - Instance/provider name.
   * @returns The provider, or `undefined` if unknown.
   */
  public provider(name: string): IMonitoringProvider | undefined {
    if (this.getInstanceConfig(name)) return this.safeInstance(name);
    return this.adhoc.find((p) => p.name === name);
  }

  public captureException(error: Error, context?: ICaptureContext): void {
    const enriched = this.enrich(context);
    for (const provider of this.activeProviders()) {
      this.safe(provider, () => provider.captureException(error, enriched));
    }
  }

  public captureMessage(message: string, context?: ICaptureContext): void {
    const enriched = this.enrich(context);
    for (const provider of this.activeProviders()) {
      this.safe(provider, () => provider.captureMessage?.(message, enriched));
    }
  }

  public addBreadcrumb(breadcrumb: IMonitoringBreadcrumb): void {
    for (const provider of this.activeProviders()) {
      this.safe(provider, () => provider.addBreadcrumb?.(breadcrumb));
    }
  }

  public setUser(user: IMonitoringUser | null): void {
    this.user = user;
    for (const provider of this.activeProviders()) {
      this.safe(provider, () => provider.setUser?.(user));
    }
  }

  public async flush(): Promise<void> {
    await Promise.all(
      this.activeProviders().map((provider) =>
        Promise.resolve()
          .then(() => provider.flush?.())
          .catch((error) => this.warn(`provider "${provider.name}" flush failed`, error))
      )
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  // Internal
  // ══════════════════════════════════════════════════════════════════════════

  /** Instance names that receive fan-out. */
  private stackNames(): string[] {
    return this.config.stack ?? Object.keys(this.config.providers ?? {});
  }

  /** Resolve the configured stack instances (safe). */
  private configuredProviders(): IMonitoringProvider[] {
    const result: IMonitoringProvider[] = [];
    for (const name of this.stackNames()) {
      const provider = this.safeInstance(name);
      if (provider) result.push(provider);
    }
    return result;
  }

  /** Configured stack instances ∪ ad-hoc providers, deduped by name. */
  private activeProviders(): IMonitoringProvider[] {
    const result: IMonitoringProvider[] = [];
    const seen = new Set<string>();
    for (const provider of [...this.configuredProviders(), ...this.adhoc]) {
      if (seen.has(provider.name)) continue;
      seen.add(provider.name);
      result.push(provider);
    }
    return result;
  }

  /** Resolve a named instance, swallowing resolution errors. */
  private safeInstance(name: string): IMonitoringProvider | undefined {
    try {
      return this.instance(name);
    } catch (error) {
      this.warn(`failed to resolve provider "${name}"`, error);
      return undefined;
    }
  }

  /** Merge the bound user into a capture context. */
  private enrich(context?: ICaptureContext): ICaptureContext {
    if (context?.user || !this.user) return context ?? {};
    return { ...context, user: this.user };
  }

  /** Run a provider call, swallowing (and logging) any throw. */
  private safe(provider: IMonitoringProvider, fn: () => void): void {
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
      this.loggerManager.create('monitoring').warn(`${message}: ${String(error)}`);
    } catch {
      /* never let internal logging throw */
    }
  }
}
