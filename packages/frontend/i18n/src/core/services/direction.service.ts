/**
 * @file direction.service.ts
 * @module @stackra/i18n/core/services
 * @description Core direction service — detects RTL/LTR and delegates physical
 *   direction application to the platform-specific adapter.
 *
 *   ## Architecture
 *
 *   ```
 *   DirectionService (core, platform-agnostic)
 *       │
 *       ├── isRtl(locale)          → pure detection (Intl-based)
 *       ├── getDirection(locale)   → returns 'ltr' | 'rtl'
 *       └── apply(locale)          → delegates to IDirectionAdapter
 *                                      │
 *                                      ├── WebDirectionAdapter (document.dir)
 *                                      └── NativeDirectionAdapter (I18nManager.forceRTL)
 *   ```
 *
 *   The adapter is registered by the platform module via the `I18N_DIRECTION_ADAPTER`
 *   DI token. If no adapter is provided, the service uses a no-op adapter (server-side).
 */

import { Injectable, Inject, Optional } from '@stackra/container';
import { I18N_DIRECTION_ADAPTER, type IDirectionAdapter } from '@stackra/contracts';

import { isRtlLocale, getDirection } from '../utils/rtl.util';

// ============================================================================
// No-op Adapter (default when no platform adapter is registered)
// ============================================================================

/**
 * No-op direction adapter — used on server-side (NestJS) where there's no
 * physical direction to apply.
 */
class NoopDirectionAdapter implements IDirectionAdapter {
  public apply(): boolean {
    return false;
  }

  public getCurrentDirection(): 'ltr' | 'rtl' {
    return 'ltr';
  }
}

// ============================================================================
// Direction Service
// ============================================================================

/**
 * Core direction service.
 *
 * Provides locale-to-direction detection (universal) and delegates physical
 * direction changes to the registered platform adapter.
 *
 * ## Usage
 *
 * ```typescript
 * // The service is wired by the module — you don't instantiate it directly.
 * // Access via DI or hooks:
 * const direction = directionService.getDirection('ar'); // 'rtl'
 * const needsRestart = directionService.apply('ar'); // applies direction
 * ```
 */
@Injectable()
export class DirectionService {
  /** The platform-specific adapter for applying direction changes. */
  private readonly adapter: IDirectionAdapter;

  /**
   * Creates the DirectionService.
   *
   * The platform adapter is injected via the `I18N_DIRECTION_ADAPTER` token.
   * If no adapter is registered (e.g., server-side), a no-op adapter is used.
   *
   * @param adapter - Optional platform-specific direction adapter
   */
  public constructor(@Optional() @Inject(I18N_DIRECTION_ADAPTER) adapter?: IDirectionAdapter) {
    this.adapter = adapter ?? new NoopDirectionAdapter();
  }

  // ── Detection (Pure, No Side Effects) ───────────────────────────────────

  /**
   * Check if a locale uses right-to-left script.
   *
   * Pure function — no side effects, no platform calls.
   *
   * @param locale - The locale code (e.g., "ar", "he", "en")
   * @returns `true` if the locale is RTL
   */
  public isRtl(locale: string): boolean {
    return isRtlLocale(locale);
  }

  /**
   * Get the text direction for a locale.
   *
   * Pure function — no side effects, no platform calls.
   *
   * @param locale - The locale code
   * @returns 'rtl' for Arabic, Hebrew, etc.; 'ltr' otherwise
   */
  public getDirection(locale: string): 'ltr' | 'rtl' {
    return getDirection(locale);
  }

  // ── Application (Delegates to Platform Adapter) ─────────────────────────

  /**
   * Apply text direction for a locale using the platform adapter.
   *
   * On web: sets `document.documentElement.dir` and `lang`.
   * On native: calls `I18nManager.forceRTL()`.
   * On server: no-op.
   *
   * @param locale - The locale to apply direction for
   * @returns `true` if a restart is needed (native only, direction changed)
   */
  public apply(locale: string): boolean {
    const direction = this.getDirection(locale);
    return this.adapter.apply(direction, locale);
  }

  /**
   * Get the current platform direction (reads from DOM/I18nManager).
   *
   * @returns The current direction as reported by the platform
   */
  public getCurrentDirection(): 'ltr' | 'rtl' {
    return this.adapter.getCurrentDirection();
  }
}
