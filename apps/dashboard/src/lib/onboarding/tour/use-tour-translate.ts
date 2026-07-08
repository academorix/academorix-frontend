/**
 * @file use-tour-translate.ts
 * @module onboarding/tour/use-tour-translate
 *
 * @description
 * Small locale-aware lookup hook backed by the tour's own message
 * catalog ({@link TOUR_MESSAGES}). Distinct from Refine's
 * `useTranslate` because the shared catalog at
 * {@link "@/lib/i18n/messages"} does not (yet) carry the
 * `onboarding.tour.*` keys — we ship them in-module until the future
 * translation pass promotes them to the shared catalog.
 *
 * Resolution order matches the shared provider:
 * active-locale catalog → English catalog → provided default → key.
 * `{{placeholder}}` interpolation is supported for the step counter.
 */

import { useCallback } from "react";

import { useLocale } from "@/lib/i18n";
import { TOUR_MESSAGES } from "@/onboarding/tour/tour-messages";

/**
 * Curried translator: pass a key + optional default and (optional)
 * placeholder params. Returns the resolved string.
 */
export function useTourTranslate(): (
  key: string,
  defaultOrParams?: string | Record<string, unknown>,
  params?: Record<string, unknown>,
) => string {
  const { locale } = useLocale();

  return useCallback(
    (key: string, defaultOrParams, params) => {
      // Two call shapes:
      //   t("key")                           → resolves key, no params.
      //   t("key", "Default text")           → default fallback.
      //   t("key", { name: "x" })            → params, no default.
      //   t("key", "Hi {{name}}", {n: "x"})  → default + params.
      const [defaultText, placeholders] =
        typeof defaultOrParams === "string"
          ? [defaultOrParams, params]
          : [undefined, defaultOrParams];

      const message = TOUR_MESSAGES[locale]?.[key] ?? TOUR_MESSAGES.en[key] ?? defaultText ?? key;

      if (!placeholders) {
        return message;
      }

      // Replace `{{name}}` placeholders (with tolerated whitespace).
      return message.replace(/\{\{\s*(\w+)\s*\}\}/g, (match, name: string) => {
        const value = placeholders[name];

        return value === undefined || value === null ? match : String(value);
      });
    },
    [locale],
  );
}
