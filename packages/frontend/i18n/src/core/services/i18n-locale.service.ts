/**
 * @file i18n-locale.service.ts
 * @module @stackra/i18n/core/services
 * @description Reactive locale orchestrator. Owns the current locale,
 *   validates against the supported set, persists to storage, applies
 *   direction via the platform adapter, triggers translation loading,
 *   and notifies subscribers.
 *
 *   Owns its own post-wire coordination via `OnModuleInit` (wires the
 *   manager ↔ locale-service bridge) and `OnApplicationBootstrap`
 *   (hydrates the persisted locale + fires the initial translation load
 *   after every module has finished `onModuleInit`).
 *
 *   ## Flow
 *
 *   ```
 *   setLocale('ar')
 *     ↳ validate against supportedLocales
 *     ↳ store.setState({ isLoading: true })
 *     ↳ storage.setLocale('ar')
 *     ↳ directionService.apply('ar')
 *     ↳ manager.loadLocale('ar')
 *     ↳ store.setState({ locale, dir, isLoading: false })
 *     ↳ notify subscribers
 *   ```
 */

import { Injectable, Inject, Optional } from "@stackra/container";
import {
  I18N_DIRECTION_SERVICE,
  I18N_LOCALE_STORAGE,
  I18N_MANAGER,
  type ILocaleStorage,
  type OnApplicationBootstrap,
  type OnModuleInit,
} from "@stackra/contracts";

import { I18N_CONFIG } from "../constants";
import type { II18nConfig, II18nStore } from "../interfaces";
import { DirectionService } from "./direction.service";
import { I18nManager } from "./i18n-manager.service";

/**
 * Reactive locale orchestrator.
 *
 * Coordinates locale switching across validation, persistence, direction,
 * and translation loading. Storage + reactive store are optional — the
 * service degrades gracefully when either is absent.
 */
@Injectable()
export class I18nLocaleService implements OnModuleInit, OnApplicationBootstrap {
  /** The currently active locale code. */
  private currentLocale: string;

  /** Supported locale codes — locales outside this list are rejected. */
  private readonly supportedLocales: string[];

  /** Whether to persist locale changes to storage. */
  private readonly persist: boolean;

  /** Optional reactive state store — updated on every locale change. */
  private store?: II18nStore;

  /** Subscribers notified after each successful `setLocale`. */
  private readonly listeners = new Set<(locale: string) => void>();

  /**
   * @param config - Merged i18n module configuration.
   * @param directionService - Direction service (RTL/LTR + platform adapter).
   * @param manager - The translation engine — receives locale-getter wiring in `onModuleInit` and `loadLocale` on every switch.
   * @param storage - Optional platform-specific storage adapter.
   */
  public constructor(
    @Inject(I18N_CONFIG) config: II18nConfig,
    @Inject(I18N_DIRECTION_SERVICE) private readonly directionService: DirectionService,
    @Inject(I18N_MANAGER) private readonly manager: I18nManager,
    @Optional() @Inject(I18N_LOCALE_STORAGE) private readonly storage?: ILocaleStorage,
  ) {
    this.supportedLocales = config.supportedLocales;
    this.persist = config.persistLocale ?? true;
    this.currentLocale = config.initialLocale ?? config.defaultLocale;
  }

  // ══════════════════════════════════════════════════════════════════════
  // Lifecycle
  // ══════════════════════════════════════════════════════════════════════

  /**
   * Wire the manager ↔ locale-service bridge — runs after both providers
   * have been constructed but before app bootstrap.
   *
   * The manager reads the current locale via a getter (closure over `this`)
   * so it never holds a stale value.
   */
  public onModuleInit(): void {
    this.manager.setLocaleGetter(() => this.currentLocale);
  }

  /**
   * Hydrate the persisted locale (when available) and fire the initial
   * translation load — runs after every module has finished
   * `onModuleInit`.
   */
  public async onApplicationBootstrap(): Promise<void> {
    const persisted = await this.getPersistedLocale();
    const initial = persisted ?? this.currentLocale;

    if (initial !== this.currentLocale) {
      // Persisted locale differs from the config default — perform the full
      // switch (validation, direction, load, notify).
      await this.setLocale(initial);
      return;
    }

    // Same locale as config default — just fire the initial load + direction.
    try {
      await this.manager.loadLocale(this.currentLocale);
    } catch {
      // Fail-open — a bad initial load must not block bootstrap.
    }
    this.directionService.apply(this.currentLocale);
  }

  // ══════════════════════════════════════════════════════════════════════
  // External wiring (kept for tests / feature composition)
  // ══════════════════════════════════════════════════════════════════════

  /**
   * Attach a reactive state store (updated on every locale change).
   *
   * @param store - The `II18nStore` implementation (e.g. `@stackra/state`).
   */
  public setStore(store: II18nStore): void {
    this.store = store;
  }

  // ══════════════════════════════════════════════════════════════════════
  // Public API
  // ══════════════════════════════════════════════════════════════════════

  /** Currently active locale code. */
  public getLocale(): string {
    return this.currentLocale;
  }

  /** Text direction for the current locale. */
  public getDir(): "ltr" | "rtl" {
    return this.directionService.getDirection(this.currentLocale);
  }

  /** Whether the current locale is right-to-left. */
  public isRTL(): boolean {
    return this.directionService.isRtl(this.currentLocale);
  }

  /** Copy of the configured supported-locale array. */
  public getSupportedLocales(): string[] {
    return [...this.supportedLocales];
  }

  /**
   * Switch to a new locale.
   *
   * Validates → sets loading → persists → applies direction → loads
   * translations → updates reactive state → notifies subscribers.
   *
   * @param locale - Target locale code.
   * @returns `true` when a restart is required (native direction change).
   * @throws When the locale is not supported.
   */
  public async setLocale(locale: string): Promise<boolean> {
    if (!this.supportedLocales.includes(locale)) {
      throw new Error(
        `[I18nLocaleService] Locale "${locale}" is not supported. ` +
          `Supported: ${this.supportedLocales.join(", ")}`,
      );
    }

    if (this.currentLocale === locale) return false;

    this.currentLocale = locale;

    // Loading state
    if (this.store) {
      this.store.setState((s) => ({ ...s, isLoading: true }));
    }

    // Persist
    if (this.persist && this.storage) {
      try {
        await this.storage.setLocale(locale);
      } catch {
        // Fail-open — persistence failures never block a locale switch.
      }
    }

    // Direction
    const needsRestart = this.directionService.apply(locale);

    // Translation load
    try {
      await this.manager.loadLocale(locale);
    } catch {
      // Fail-open — translation load errors already surface via the loader.
    }

    // Reactive state
    if (this.store) {
      this.store.setState((s) => ({
        ...s,
        locale,
        dir: this.directionService.getDirection(locale),
        isLoading: false,
      }));
    }

    // Notify subscribers
    for (const listener of this.listeners) {
      try {
        listener(locale);
      } catch {
        // Never let a rogue subscriber break subsequent ones.
      }
    }

    return needsRestart;
  }

  /**
   * Read the persisted locale from storage.
   *
   * @returns The stored locale if valid + supported, otherwise `null`.
   */
  public async getPersistedLocale(): Promise<string | null> {
    if (!this.persist || !this.storage) return null;

    try {
      const stored = await this.storage.getLocale();
      return stored && this.supportedLocales.includes(stored) ? stored : null;
    } catch {
      return null;
    }
  }

  /**
   * Subscribe to locale changes. Compatible with `useSyncExternalStore`.
   *
   * @param listener - Callback fired with the new locale after each switch.
   * @returns Unsubscribe function.
   */
  public subscribe(listener: (locale: string) => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  /** Stable snapshot for `useSyncExternalStore`. */
  public getSnapshot(): string {
    return this.currentLocale;
  }
}
