/**
 * @file web-direction.adapter.ts
 * @module @stackra/i18n/react/adapters
 * @description Web direction adapter — applies RTL/LTR via `document.documentElement`.
 *
 *   Sets both `dir` (for CSS logical properties, flexbox direction) and
 *   `lang` (for browser font selection, screen readers, hyphenation).
 *
 *   ## Example
 *
 *   When `apply('rtl', 'ar')` is called:
 *   - `<html dir="rtl" lang="ar">` is set on the document element
 *   - CSS logical properties (`margin-inline-start`) flip automatically
 *   - Tailwind CSS `rtl:` variants activate
 */

import { Injectable } from "@stackra/container";
import type { IDirectionAdapter } from "@stackra/contracts";

/**
 * Web platform direction adapter.
 *
 * Applies text direction by setting `dir` and `lang` attributes on
 * `document.documentElement` (`<html>` element).
 *
 * Registered automatically by `WebI18nModule` via the `I18N_DIRECTION_ADAPTER` token.
 */
@Injectable()
export class WebDirectionAdapter implements IDirectionAdapter {
  /**
   * Apply direction to the document.
   *
   * @param direction - Target direction ('ltr' or 'rtl')
   * @param locale - The locale code (set as `lang` attribute)
   * @returns Always `false` — web never needs a restart
   */
  public apply(direction: "ltr" | "rtl", locale: string): boolean {
    if (typeof document === "undefined") return false;

    document.documentElement.dir = direction;
    document.documentElement.lang = locale;

    return false; // Web never needs restart
  }

  /**
   * Get the current direction from the document.
   *
   * @returns The current `dir` attribute value, defaults to 'ltr'
   */
  public getCurrentDirection(): "ltr" | "rtl" {
    if (typeof document === "undefined") return "ltr";
    return (document.documentElement.dir as "ltr" | "rtl") || "ltr";
  }
}
