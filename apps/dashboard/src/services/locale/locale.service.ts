/**
 * @file locale.service.ts
 * @module @academorix/dashboard/services/locale
 * @description Container-owned locale controller.
 *
 *   Owns the active locale, persists it to `localStorage`, syncs
 *   `<html lang>` + `<html dir>`, and exposes a `translate()` method
 *   plus a Refine {@link I18nProvider} factory. Consumers reach the
 *   reactive state through `useLocale()` and the Refine i18n provider
 *   through `useI18nProvider()`.
 *
 *   ## Migration note
 *
 *   Replaces the legacy `<LocaleProvider>` context in
 *   `apps/dashboard/src/providers/locale-provider.tsx`. The public
 *   `useLocale()` / `useTranslate()` / `useI18nProvider()` hooks keep
 *   their previous signatures.
 *
 *   ## Persistence + DOM side effects
 *
 *   `onModuleInit` seeds from `localStorage` (falls back to
 *   `navigator.language` → `DEFAULT_LOCALE`) and paints `<html lang>` +
 *   `<html dir>`. Every subsequent `setLocale()` persists + re-paints.
 */

import type { I18nProvider } from "@refinedev/core";

import { Injectable, type OnModuleInit } from "@stackra/container";

import type { Locale } from "@/i18n/config";
import type { MessageCatalog } from "@/i18n/i18n-provider";
import type { ILocaleSnapshot } from "./locale.interface";

import {
  DEFAULT_LOCALE,
  isRtlLocale,
  isSupportedLocale,
  LOCALE_BCP47,
  LOCALE_STORAGE_KEY,
} from "@/i18n/config";
import { CATALOGS } from "@/i18n/dictionaries";
import { createI18nProvider, translateMessage } from "@/i18n/i18n-provider";

/**
 * Read the initial locale from `localStorage`. Falls back to
 * `navigator.language` (first two chars) and finally {@link DEFAULT_LOCALE}.
 *
 * Kept as a private helper (module-scoped, not a method) so the
 * constructor can seed `#snapshot` synchronously without touching `this`.
 */
function readInitialLocale(): Locale {
  try {
    if (typeof window !== "undefined") {
      const raw = window.localStorage.getItem(LOCALE_STORAGE_KEY);

      if (raw && isSupportedLocale(raw)) {
        return raw;
      }
    }
  } catch {
    // ignore private-mode / disabled storage
  }

  if (typeof navigator !== "undefined") {
    const nav = navigator.language?.slice(0, 2);

    if (nav && isSupportedLocale(nav)) {
      return nav;
    }
  }

  return DEFAULT_LOCALE;
}

/** Reactive locale controller. */
@Injectable()
export class LocaleService implements OnModuleInit {
  #snapshot: ILocaleSnapshot;

  readonly #listeners = new Set<() => void>();

  /** In-memory catalog reference — kept private so tests can swap it later. */
  readonly #catalogs: Record<Locale, MessageCatalog> = CATALOGS;

  public constructor() {
    const locale = readInitialLocale();

    this.#snapshot = { locale, dir: isRtlLocale(locale) ? "rtl" : "ltr" };
  }

  /**
   * Paint `<html lang dir>` on startup. The constructor sets `#snapshot`
   * synchronously so a caller resolving the service before init reads
   * the correct initial locale; the DOM write happens here because a
   * pre-DOM environment (Node test harness, module-level construction
   * in an SSR probe) would blow up on `document.documentElement`.
   */
  public onModuleInit(): void {
    this.#syncHtml(this.#snapshot);
  }

  /** Subscribe to snapshot changes. */
  public readonly subscribe = (listener: () => void): (() => void) => {
    this.#listeners.add(listener);

    return (): void => {
      this.#listeners.delete(listener);
    };
  };

  /** Current snapshot — stable identity between mutations. */
  public readonly getSnapshot = (): ILocaleSnapshot => this.#snapshot;

  /**
   * Update the active locale. Persists to `localStorage`, re-paints
   * `<html lang dir>`, and notifies subscribers.
   *
   * No-op when the locale already matches.
   */
  public readonly setLocale = (next: Locale): void => {
    if (this.#snapshot.locale === next) {
      return;
    }

    const snapshot: ILocaleSnapshot = { locale: next, dir: isRtlLocale(next) ? "rtl" : "ltr" };

    this.#snapshot = snapshot;

    try {
      if (typeof window !== "undefined") {
        window.localStorage.setItem(LOCALE_STORAGE_KEY, next);
      }
    } catch {
      // ignore private-mode / disabled storage
    }

    this.#syncHtml(snapshot);
    this.#emit();
  };

  /**
   * Translate a key against the active locale. Delegates to the shared
   * catalog helper — the resolution order is:
   *
   *   active locale → English fallback → default message → key
   *
   * @param key - Dot-keyed message id.
   * @param vars - Optional interpolation values (`{{name}}` / `{name}`).
   * @param fallback - Optional English default when no catalog entry exists.
   * @returns Translated string.
   */
  public readonly translate = (
    key: string,
    vars?: Record<string, unknown>,
    fallback?: string,
  ): string => translateMessage(this.#catalogs, this.#snapshot.locale, key, vars, fallback);

  /**
   * Build a Refine `I18nProvider` bound to the current locale. Refine
   * consumes this via `<Refine i18nProvider={…} />`; the React hook that
   * exposes it (`useI18nProvider`) memoises the return so the identity
   * only changes when the locale does.
   *
   * The `changeLocale` callback delegates to `setLocale` so a language
   * toggle inside a Refine hook still flows through the service's
   * persistence + `<html lang dir>` sync path.
   */
  public readonly createI18nProvider = (): I18nProvider =>
    createI18nProvider(this.#catalogs, this.#snapshot.locale, this.setLocale);

  /** Write `<html lang dir>`. Guarded for non-DOM environments. */
  #syncHtml(snapshot: ILocaleSnapshot): void {
    if (typeof document === "undefined") {
      return;
    }

    const root = document.documentElement;

    root.setAttribute("lang", LOCALE_BCP47[snapshot.locale]);
    root.setAttribute("dir", snapshot.dir);
  }

  /** Emit — errors bubble; a bad subscriber is a bug. */
  #emit(): void {
    for (const listener of this.#listeners) {
      listener();
    }
  }
}
