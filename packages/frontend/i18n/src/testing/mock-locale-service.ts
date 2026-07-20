/**
 * @file mock-locale-service.ts
 * @module @stackra/i18n/testing
 * @description In-memory `II18nLocaleService` implementation for tests.
 *
 *   Skips the direction / storage / manager wiring — direction is
 *   derived from a static RTL locale set passed in options, no I/O is
 *   performed, and subscribers are notified synchronously on every
 *   `setLocale`.
 */

import type { II18nLocaleService } from "@stackra/contracts";

const RTL_LOCALES = new Set(["ar", "he", "fa", "ur", "ps", "sd", "yi", "ku"]);

/**
 * In-memory locale orchestrator for testing.
 */
export class MockLocaleService implements II18nLocaleService {
  private currentLocale: string;
  private readonly supportedLocales: string[];
  private readonly listeners = new Set<(locale: string) => void>();

  /** Every locale-set call, in order. */
  public readonly calls: string[] = [];

  public constructor(options?: { defaultLocale?: string; supportedLocales?: string[] }) {
    this.currentLocale = options?.defaultLocale ?? "en";
    this.supportedLocales = options?.supportedLocales ?? [this.currentLocale];
  }

  public getLocale(): string {
    return this.currentLocale;
  }

  public getDir(): "ltr" | "rtl" {
    return this.isRTL() ? "rtl" : "ltr";
  }

  public isRTL(): boolean {
    const base = this.currentLocale.split("-")[0]!;
    return RTL_LOCALES.has(this.currentLocale) || RTL_LOCALES.has(base);
  }

  public getSupportedLocales(): string[] {
    return [...this.supportedLocales];
  }

  public async setLocale(locale: string): Promise<boolean> {
    if (!this.supportedLocales.includes(locale)) {
      throw new Error(`[MockLocaleService] locale "${locale}" not supported`);
    }
    if (this.currentLocale === locale) return false;

    this.currentLocale = locale;
    this.calls.push(locale);
    for (const listener of this.listeners) listener(locale);
    return false;
  }

  public async getPersistedLocale(): Promise<string | null> {
    return null;
  }

  public subscribe(listener: (locale: string) => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  public getSnapshot(): string {
    return this.currentLocale;
  }

  /** Reset the recorded call ledger. */
  public reset(): void {
    this.calls.length = 0;
  }
}
