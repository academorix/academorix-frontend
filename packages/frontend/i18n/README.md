# @stackra/i18n

Unified internationalization package for the Stackra platform — handles
translation, locale management, direction (RTL/LTR), and type-safe key
resolution across web, native, and backend.

## Subpath Exports

| Import                   | Purpose                                    |
| ------------------------ | ------------------------------------------ |
| `@stackra/i18n`          | Core engine, loaders, types, utilities     |
| `@stackra/i18n/react`    | Web module, hooks, resolvers, adapters     |
| `@stackra/i18n/native`   | Native module, device locale, AsyncStorage |
| `@stackra/i18n/nestjs`   | NestJS middleware, per-request resolution  |
| `@stackra/i18n/vite`     | Vite plugin for auto-discovery + HMR       |
| `@stackra/i18n/commands` | CLI tools (type generation)                |

## Quick Start (Web)

```typescript
import { WebI18nModule, useI18n } from '@stackra/i18n/react';
import { StaticLoader } from '@stackra/i18n';

// Initialize (app entry)
WebI18nModule.forRoot({
  defaultLocale: 'en',
  supportedLocales: ['en', 'ar'],
  loader: StaticLoader,
  loaderOptions: { translations: { en, ar } },
});

// In components
function MyComponent() {
  const { t, locale, setLocale, dir, isRTL } = useI18n();
  return <div dir={dir}>{t('common.hello')}</div>;
}
```

## Quick Start (React Native)

```typescript
import { NativeI18nModule, useI18n } from '@stackra/i18n/native';

const { needsRestart } = NativeI18nModule.forRoot({
  defaultLocale: 'en',
  supportedLocales: ['en', 'ar'],
  loader: StaticLoader,
  loaderOptions: { translations: { en, ar } },
});

if (needsRestart) await Updates.reloadAsync();
```

## Quick Start (NestJS)

```typescript
import { NestI18nModule } from '@stackra/i18n/nestjs';

NestI18nModule.forRoot({
  defaultLocale: 'en',
  supportedLocales: ['en', 'ar'],
  loader: StaticLoader,
  loaderOptions: { translations: { en, ar } },
});
// Locale auto-resolved from Accept-Language / headers / query params per request
```

## Direction (RTL/LTR)

Direction is handled automatically:

- **Web**: Sets `<html dir="rtl" lang="ar">` via `WebDirectionAdapter`
- **Native**: Calls `I18nManager.forceRTL()` via `NativeDirectionAdapter`
- **NestJS**: No-op (server-side, no DOM)

```typescript
import { useDirection } from '@stackra/i18n/react';

const { dir, isRTL } = useDirection();
```

## Resolvers (Locale Detection)

Web resolvers (in priority order):

- `SubdomainResolver` — `ar.myapp.com`
- `UrlParamResolver` — `?lang=ar` or `/ar/dashboard`
- `CookieResolver` — `document.cookie`
- `LocalStorageResolver` — user's saved preference
- `NavigatorResolver` — browser language

Native resolvers:

- `AsyncStorageResolver` — saved preference
- `DeviceLocaleResolver` — `expo-localization`

NestJS resolvers:

- `HeaderResolver` — `X-Language` header
- `QueryResolver` — `?lang=ar`
- `NestCookieResolver` — request cookies
- `AcceptLanguageResolver` — `Accept-Language` header

## Loaders

| Loader                | Use Case                                      |
| --------------------- | --------------------------------------------- |
| `StaticLoader`        | Pre-bundled JSON (Vite plugin, direct import) |
| `DynamicImportLoader` | Code-split per locale (Vite)                  |
| `HttpLoader`          | Remote endpoint (CMS-managed)                 |

## Vite Plugin

```typescript
import { i18nPlugin } from '@stackra/i18n/vite';

export default defineConfig({
  plugins: [i18nPlugin({ translationsDir: './src/i18n' })],
});
```

Exposes `virtual:i18n/translations` with HMR support.

## Type Safety

Generate types from translation files:

```typescript
import { generateI18nTypes } from '@stackra/i18n/commands';

generateI18nTypes({
  translationsPath: './src/i18n',
  outputPath: './src/@types/i18n.generated.d.ts',
});
```

## License

MIT © Stackra L.L.C
