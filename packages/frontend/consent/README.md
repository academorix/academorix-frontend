# @stackra/consent

Client-side GDPR/CCPA consent management for the Stackra framework — consent
categories, a reactive preference store, pluggable storage adapters,
cross-platform React hooks, and a HeroUI consent banner. Backend-agnostic.

## Subpaths

| Import                   | Contents                                                                                          |
| ------------------------ | ------------------------------------------------------------------------------------------------- |
| `@stackra/consent`       | Core: `ConsentModule`, `ConsentManager`, `ConsentRegistry`, `MemoryConsentAdapter`, hooks, tokens |
| `@stackra/consent/react` | Web: `WebConsentModule`, `LocalStorageConsentAdapter`, `<ConsentBanner>`                          |

> **Native is deferred.** A React Native entry (`@stackra/consent/native`) with
> an `AsyncStorageConsentAdapter` and native bottom-sheet banner is planned but
> intentionally **not** shipped in this version. A NestJS server entry is
> likewise deferred.

## Installation

```jsonc
// package.json
"@stackra/consent": "workspace:*"
```

## Quick start (web)

```typescript
import { Module } from "@stackra/container";
import { WebConsentModule } from "@stackra/consent/react";

@Module({
  imports: [
    WebConsentModule.forRoot({
      categories: [
        {
          slug: "necessary",
          label: "Necessary",
          description: "Essential cookies",
          required: true,
          default: true,
        },
        {
          slug: "analytics",
          label: "Analytics",
          description: "Usage analytics",
          required: false,
          default: false,
        },
      ],
      defaultMode: "opt-in",
    }),
  ],
})
export class AppModule {}
```

```tsx
import { ConsentBanner } from "@stackra/consent/react";
import { useConsentGate } from "@stackra/consent";

function App() {
  const { allowed } = useConsentGate("analytics");
  return (
    <>
      {allowed ? <Analytics /> : null}
      <ConsentBanner locale="en" />
    </>
  );
}
```

## Lifecycle

- `ConsentRegistry` implements `OnModuleInit` and seeds the configured
  categories during module init.
- `ConsentManager` implements `OnApplicationBootstrap` — it reads the populated
  registry, hydrates from the storage adapter, and applies defaults **after**
  every module has initialised.

There are no bootstrap classes or side-effect provider factories.

## Events

When an `EVENT_EMITTER` (`@stackra/contracts`) is registered, the manager emits
`CONSENT_EVENTS` (`consent.granted`, `consent.revoked`, `consent.decided`,
`consent.preferences.updated`) on a fail-open basis. The emitter is injected as
optional — the package works without it.

## License

MIT © Stackra L.L.C
