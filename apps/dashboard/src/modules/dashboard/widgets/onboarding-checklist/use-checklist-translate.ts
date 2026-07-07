/**
 * @file use-checklist-translate.ts
 * @module modules/dashboard/widgets/onboarding-checklist/use-checklist-translate
 *
 * @description
 * Locale-aware label lookup backed by the checklist's own message catalog.
 * Mirrors the pattern used by the tour's `use-tour-translate.ts` — the
 * shared translator at `@/lib/i18n` does not yet carry the
 * `onboarding.checklist.*` keys, so we ship them in-module until a future
 * translation pass promotes them.
 *
 * Resolution order matches the shared provider:
 * active-locale catalog → English catalog → provided default → key.
 * `{{placeholder}}` interpolation is supported for the progress counter.
 */

import { useCallback } from "react";

import { useLocale } from "@/lib/i18n";
import { CHECKLIST_MESSAGES } from "@/modules/dashboard/widgets/onboarding-checklist/checklist-messages";

/**
 * Curried translator: pass a key + optional default and (optional)
 * placeholder params. Returns the resolved string.
 *
 * Call shapes:
 *   t("key")                           → resolves key, no params.
 *   t("key", "Default text")           → default fallback.
 *   t("key", { name: "x" })            → params, no default.
 *   t("key", "Hi {{name}}", { n: "x"}) → default + params.
 */
export function useChecklistTranslate(): (
  key: string,
  defaultOrParams?: string | Record<string, unknown>,
  params?: Record<string, unknown>,
) => string {
  const { locale } = useLocale();

  return useCallback(
    (key, defaultOrParams, params) => {
      const [defaultText, placeholders] =
        typeof defaultOrParams === "string"
          ? [defaultOrParams, params]
          : [undefined, defaultOrParams];

      const message =
        CHECKLIST_MESSAGES[locale]?.[key] ?? CHECKLIST_MESSAGES.en[key] ?? defaultText ?? key;

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
