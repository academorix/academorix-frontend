/**
 * @file mocks.ts
 * @module @stackra/i18n/testing
 * @description Lightweight mocks for the smaller i18n contract seams —
 *   direction adapter, direction service, locale storage, translation
 *   provider, and loader. Kept in a single file since each is small.
 */

import type {
  IDirectionAdapter,
  IDirectionService,
  II18nLoader,
  I18nTranslation,
  ILocaleStorage,
  ITranslationProvider,
} from "@stackra/contracts";

const RTL_LOCALES = new Set(["ar", "he", "fa", "ur", "ps", "sd", "yi", "ku"]);

// ── Direction adapter ────────────────────────────────────────────────────

/**
 * In-memory `IDirectionAdapter` — records every `apply` call and lets
 * tests set the return value.
 */
export class MockDirectionAdapter implements IDirectionAdapter {
  public direction: "ltr" | "rtl" = "ltr";
  public restart = false;
  public readonly calls: Array<{ direction: "ltr" | "rtl"; locale: string }> = [];

  public apply(direction: "ltr" | "rtl", locale: string): boolean {
    this.direction = direction;
    this.calls.push({ direction, locale });
    return this.restart;
  }

  public getCurrentDirection(): "ltr" | "rtl" {
    return this.direction;
  }
}

// ── Direction service ────────────────────────────────────────────────────

/**
 * In-memory `IDirectionService` — pure detection, no adapter delegation.
 */
export class MockDirectionService implements IDirectionService {
  public direction: "ltr" | "rtl" = "ltr";

  public isRtl(locale: string): boolean {
    const base = locale.split("-")[0]!;
    return RTL_LOCALES.has(locale) || RTL_LOCALES.has(base);
  }

  public getDirection(locale: string): "ltr" | "rtl" {
    return this.isRtl(locale) ? "rtl" : "ltr";
  }

  public apply(locale: string): boolean {
    this.direction = this.getDirection(locale);
    return false;
  }

  public getCurrentDirection(): "ltr" | "rtl" {
    return this.direction;
  }
}

// ── Locale storage ───────────────────────────────────────────────────────

/**
 * In-memory `ILocaleStorage` — plain Map, no I/O.
 */
export class MockLocaleStorage implements ILocaleStorage {
  private stored: string | null = null;
  public readonly calls: Array<{ op: "get" | "set" | "clear"; value?: string }> = [];

  public constructor(seed?: string | null) {
    this.stored = seed ?? null;
  }

  public async getLocale(): Promise<string | null> {
    this.calls.push({ op: "get" });
    return this.stored;
  }

  public async setLocale(locale: string): Promise<void> {
    this.calls.push({ op: "set", value: locale });
    this.stored = locale;
  }

  public async clearLocale(): Promise<void> {
    this.calls.push({ op: "clear" });
    this.stored = null;
  }
}

// ── Translation provider ─────────────────────────────────────────────────

/**
 * Echoing `ITranslationProvider` — returns the source text unchanged
 * so tests can assert on invocation without depending on a real MT
 * backend.
 */
export class MockTranslationProvider implements ITranslationProvider {
  public readonly calls: Array<{ key: string; text: string; from: string; to: string }> = [];

  public getName(): string {
    return "mock";
  }

  public async translate(key: string, text: string, from: string, to: string): Promise<string> {
    this.calls.push({ key, text, from, to });
    return text;
  }

  public async translateBatch(
    entries: ReadonlyArray<{ key: string; text: string }>,
    from: string,
    to: string,
  ): Promise<string[]> {
    for (const entry of entries) this.calls.push({ ...entry, from, to });
    return entries.map((entry) => entry.text);
  }

  public supports(): boolean {
    return true;
  }
}

// ── Loader ───────────────────────────────────────────────────────────────

/**
 * In-memory `II18nLoader` — serves a fixed translations map.
 */
export class MockI18nLoader implements II18nLoader {
  public readonly calls: string[] = [];

  public constructor(private readonly translations: Record<string, I18nTranslation>) {}

  public async load(locale: string): Promise<I18nTranslation> {
    this.calls.push(locale);
    return this.translations[locale] ?? {};
  }

  public async languages(): Promise<string[]> {
    return Object.keys(this.translations);
  }
}
