/**
 * @file theme-api.service.ts
 * @module @stackra/theming/services
 * @description Loads theme definitions from a remote API on application bootstrap.
 *   Fail-soft: logs a warning and continues with local themes on failure.
 */

import { Injectable, Inject } from '@stackra/container';
import type { ITheme, OnApplicationBootstrap } from '@stackra/contracts';
import { THEMING_CONFIG, THEME_REGISTRY } from '@stackra/contracts';
import type { IThemingModuleOptions } from '../interfaces';
import { ThemeRegistry } from '../registries';

// ============================================================================
// Service
// ============================================================================

/**
 * Server-driven theme loader.
 *
 * Fetches theme definitions from a remote API on bootstrap and registers
 * them into the ThemeRegistry. Fail-soft: logs a warning and continues
 * with locally-registered themes on failure.
 */
@Injectable()
export class ThemeApiService implements OnApplicationBootstrap {
  /** Whether the initial bootstrap fetch has run. */
  private bootstrapped = false;

  /**
   * @param config - Theme module options (may include api.*).
   * @param registry - Shared theme registry.
   */
  public constructor(
    @Inject(THEMING_CONFIG) private readonly config: IThemingModuleOptions,
    @Inject(THEME_REGISTRY) private readonly registry: ThemeRegistry
  ) {}

  // ── Public API ────────────────────────────────────────────────────────────

  /**
   * Whether the service is configured to talk to a backend.
   *
   * @returns True if API is enabled.
   */
  public get isEnabled(): boolean {
    return Boolean(this.config.api?.enabled);
  }

  /**
   * Lifecycle hook — runs once after every module bootstraps.
   * Skips silently when the API isn't enabled.
   */
  public async onApplicationBootstrap(): Promise<void> {
    if (!this.isEnabled) return;
    if (this.bootstrapped) return;

    try {
      await this.fetchAndRegister();
      this.bootstrapped = true;
    } catch (error: unknown) {
      // Fail-soft: warn and continue with local themes
      console.warn(
        `[ThemeApi] Bootstrap fetch failed: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Trigger a manual reload of remote themes.
   *
   * @returns The list of remote themes registered.
   */
  public async refresh(): Promise<ITheme[]> {
    if (!this.isEnabled) return [];
    return this.fetchAndRegister();
  }

  // ── Private ───────────────────────────────────────────────────────────────

  /**
   * Fetch themes and register new ones.
   *
   * @returns Array of newly registered theme configs.
   */
  private async fetchAndRegister(): Promise<ITheme[]> {
    const api = this.config.api!;
    const url = api.staticJson ?? `${api.baseUrl ?? '/api/themes'}`;
    const response = await fetch(url);
    const data = await response.json();

    const list: ITheme[] = Array.isArray(data) ? data : (data?.themes ?? data?.data ?? []);

    const registered: ITheme[] = [];
    for (const entry of list) {
      if (!entry?.id) continue;
      if (this.registry.has(entry.id)) continue;

      // Build a minimal ITheme from the wire payload. Server-generated
      // extras (timestamps, tenantId, tokens) flow through as-is.
      const theme: ITheme = {
        id: entry.id,
        label: entry.label ?? entry.id,
        color: entry.color,
        previewImage: entry.previewImage,
        description: entry.description,
        isDark: entry.isDark,
        tokens: entry.tokens,
        createdAt: entry.createdAt,
        updatedAt: entry.updatedAt,
        tenantId: entry.tenantId,
      };
      this.registry.register(entry.id, theme);
      registered.push(theme);
    }

    return registered;
  }
}
