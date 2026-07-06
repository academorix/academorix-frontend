# @academorix/i18n

Locale primitives + React runtime for the Academorix workspace: type-safe
`LocaleProvider`, `useLocale` hook, RTL detection, Intl formatters, and a
lightweight `MessageCatalog` contract with `{{placeholder}}` interpolation.

Depends on `@academorix/core` (for brand utilities) and React 19.

## Public API

| Subpath                     | Exports                                                                                                             |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| `@academorix/i18n/config`   | `defineI18nConfig`, `I18nConfig<T>`                                                                                 |
| `@academorix/i18n/context`  | `createLocaleContext<T>()` → `{ LocaleProvider, useLocale, isSupportedLocale, isRtlLocale, resolveLocale, config }` |
| `@academorix/i18n/format`   | `formatDate`, `formatDateTime`, `formatNumber`, `formatCurrency`, `formatRelativeTime`, `formatList`                |
| `@academorix/i18n/messages` | `MessageCatalog`, `interpolate(message, params)`                                                                    |

Prefer subpath imports for optimal tree-shaking.

## Design principles

- **Types stay app-owned.** Each app declares its concrete `LOCALES` tuple and
  passes it through `defineI18nConfig`. Downstream primitives (Provider, hook,
  predicates) are typed against that tuple.
- **Runtime stays package-owned.** localStorage persistence, `<html lang>` +
  `<html dir>` sync, provider memoization — all handled once in the factory.
- **Formatters stay pure.** No React, no state — safe for Server Components,
  hooks, and vanilla code alike.

## Usage

### 1. Declare the app's config

```ts
// apps/dashboard/src/config/i18n.config.ts
import { defineI18nConfig } from "@academorix/i18n/config";

export const LOCALES = ["en", "ar"] as const;
export type Locale = (typeof LOCALES)[number];

export const i18nConfig = defineI18nConfig({
  locales: LOCALES,
  defaultLocale: "en",
  rtlLocales: ["ar"],
  labels: { en: "English", ar: "العربية" },
  bcp47: { en: "en-US", ar: "ar-EG" },
  storageKey: "academorix.locale",
  timeZone: "UTC",
  currencyByLocale: { en: "USD", ar: "USD" },
});
```

### 2. Instantiate the provider bundle

```ts
// apps/dashboard/src/lib/i18n/locale-context.ts
import { createLocaleContext } from "@academorix/i18n/context";
import { i18nConfig, type Locale } from "@/config/i18n.config";

export const {
  LocaleProvider,
  useLocale,
  isSupportedLocale,
  isRtlLocale,
  resolveLocale,
} = createLocaleContext<Locale>(i18nConfig);
```

### 3. Mount it once

```tsx
// apps/dashboard/src/providers.tsx
<LocaleProvider>
  <App />
</LocaleProvider>
```

### 4. Consume anywhere

```tsx
import { useLocale } from "@/lib/i18n";
import { formatDate } from "@academorix/i18n/format";
import { i18nConfig } from "@/config/i18n.config";

function DateCell({ value }: { value: string }) {
  const { locale } = useLocale();

  return <span>{formatDate(new Date(value), i18nConfig.bcp47[locale])}</span>;
}
```
