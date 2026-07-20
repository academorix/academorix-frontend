# @stackra/pwa

Production-grade PWA runtime and build-time toolkit for the Stackra framework — one package, one config, install prompts, service-worker updates, standalone detection, and the manifest / Workbox / Vite / TWA config builders.

## What ships

- **Runtime (DI + React)** — `PwaModule` binds a singleton `PwaService` (install prompt, service-worker update, standalone detection, install-source attribution) and an `AnalyticsBridgeService` that fails soft when `@stackra/analytics` isn't wired.
- **React hooks** — 13 hooks over the singleton store, all backed by `useSyncExternalStore` for tearing-free reads under concurrent React.
- **HeroUI-based components** — install prompt (with iOS Safari tutorial fallback), update prompt, splash screen, install-QR code, and a `<PwaHead>` meta emitter.
- **Build-time helpers** — locale-aware Web App Manifest builder (`@stackra/pwa/manifest`), curated Workbox runtime-caching (`@stackra/pwa/workbox`), `vite-plugin-pwa` + `@vite-pwa/assets-generator` config builders (`@stackra/pwa/vite`), and a Bubblewrap TWA config builder (`@stackra/pwa/twa`) for Android APK/AAB generation.
- **Testing** — `MockPwaService`, `MockBeforeInstallPromptEvent`, `MockServiceWorkerRegistration`, `MockAnalyticsClient`, and a `createMockPwa()` assertable factory in `@stackra/pwa/testing`.

Push notifications, in-app notification centres, and native push tokens live in a dedicated package: [`@stackra/notifications`](../notifications/README.md). This package is web-only — native PWA installation is a browser-specific paradigm, and RN apps use their own app-store distribution and don't need PWA install prompts.

## Install

```bash
pnpm add @stackra/pwa @stackra/container @stackra/contracts @stackra/support \
         @stackra/network reflect-metadata
# React bindings + HeroUI-based components:
pnpm add @stackra/ui react
# Optional peers (consumers install only what they use):
pnpm add vite-plugin-pwa @vite-pwa/assets-generator qrcode
# For push / in-app notifications, install:
pnpm add @stackra/notifications
```

## Wire the module

```typescript
import { Module } from '@stackra/container';
import { PwaModule } from '@stackra/pwa';
import { WebNetworkModule } from '@stackra/network/react';
import { AnalyticsModule } from '@stackra/analytics';

@Module({
  imports: [
    WebNetworkModule.forRoot(),
    // AnalyticsModule is optional — when present, every PWA lifecycle
    // event auto-flows through `manager.track(...)`. No adapter
    // provider needed.
    AnalyticsModule.forRoot({
      providers: { ga4: { driver: 'ga4', measurementId: 'G-XXXXXX' } },
    }),
    PwaModule.forRoot({
      install: { delayMs: 20_000, maxDismissals: 2 },
      update: { pollingIntervalMs: 60_000 },
      autoRequestPersistent: true,
    }),
  ],
})
export class AppModule {}
```

## `vite.config.ts`

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA, type VitePWAOptions } from 'vite-plugin-pwa';
import { getVitePwaOptions } from '@stackra/pwa/vite';

export default defineConfig({
  plugins: [
    react(),
    VitePWA(
      getVitePwaOptions({
        manifest: {
          name: 'Stackra',
          shortName: 'Stackra',
          description: 'The operating system for modern teams.',
          lang: 'en-US',
          themeColor: '#0EA5E9',
          backgroundColor: '#FFFFFF',
          icons: [
            { src: '/pwa-192.png', sizes: '192x192', type: 'image/png' },
            { src: '/pwa-512.png', sizes: '512x512', type: 'image/png' },
          ],
          translations: {
            'ar-EG': { name: 'ستكرا', short_name: 'ستكرا' },
          },
          orientation: 'portrait',
          categories: ['productivity'],
          // Full W3C + Chromium surface — `launch_handler`,
          // `share_target`, `file_handlers`, `protocol_handlers`,
          // `widgets`, `tab_strip`, `edge_side_panel`, `note_taking`,
          // `capture_links`, `handle_links`, `scope_extensions` all
          // pass through untouched when supplied.
          launchHandler: { client_mode: 'focus-existing' },
          shareTarget: {
            action: '/share',
            method: 'POST',
            enctype: 'multipart/form-data',
            params: { title: 't', text: 'x', files: [{ name: 'attachment', accept: ['image/*'] }] },
          },
        },
        runtimeCaching: { apiPathPrefix: '/api' },
        registerType: 'prompt',
      }) as VitePWAOptions
    ),
  ],
});
```

## App root — head + banners

```tsx
import {
  PwaHead,
  InstallPromptBanner,
  UpdatePromptBanner,
  OfflineBanner,
  SplashScreen,
} from '@stackra/pwa/react';

export function AppRoot() {
  return (
    <>
      <PwaHead
        themeColor="#0EA5E9"
        appleIcons={[{ href: '/apple-touch-icon.png', sizes: '180x180' }]}
        appleStartupImages={applePwaStartupImages}
        appleWebAppTitle="Stackra"
      />
      <SplashScreen isVisible={!ready} logo={<img src="/logo.svg" width={72} />} />
      <MainRoutes />
      <div className="fixed inset-x-0 top-2 z-40 mx-auto max-w-3xl px-4">
        <UpdatePromptBanner />
      </div>
      <div className="fixed inset-x-0 bottom-4 z-40 mx-auto max-w-3xl px-4">
        <OfflineBanner />
        <InstallPromptBanner />
      </div>
    </>
  );
}
```

`<InstallPromptBanner>` auto-detects iOS Safari and renders a two-step "Share → Add to Home Screen" tutorial. On every other browser it renders the standard `Card` + install button and drives the browser's own `beforeinstallprompt`.

## Hooks

```tsx
import {
  usePwa,
  useInstallPrompt,
  useUpdatePrompt,
  useStandaloneMode,
  useDisplayMode,
  useUtmParams,
  useInstallSource,
  useWebShare,
  useVibration,
  useWakeLock,
  useVisibilityState,
  usePageVisibility,
  useAdaptiveLoading,
  useSafeAreaInsets,
  useNetworkStatus,
} from '@stackra/pwa/react';
```

Every hook is SSR-safe. Every observable hook is a thin slice over the DI singleton via `useSyncExternalStore`.

## Offline mutation queueing

`@stackra/pwa` does not ship a durable offline mutation queue. For durable offline mutation queues, compose:

- `@stackra/sync`'s `OperationQueue` + `SyncEngine` — full conflict resolution + auto-drain on reconnect. Best fit for enterprise apps that need bidirectional sync.
- Or `@stackra/queue`'s `IndexedDBConnector` / `LocalStorageConnector` — a queueing primitive if you own the drain logic.

```tsx
// Illustrative composition — see @stackra/sync's README for the full API.
import { useSyncEngine } from '@stackra/sync/react';
import { useNetworkStatus } from '@stackra/network/react';

function ChatComposer({ api }) {
  const { enqueue } = useSyncEngine();
  const { isOnline } = useNetworkStatus();
  const send = async (text: string) =>
    isOnline ? api.sendMessage(text) : enqueue({ type: 'chat.send', payload: { text } });
  return null;
}
```

## `@vite-pwa/assets-generator`

```typescript
// scripts/generate-pwa-assets.ts
import { getAssetsGeneratorConfig } from '@stackra/pwa/vite';

const config = getAssetsGeneratorConfig({
  source: './public/logo.svg',
  preset: 'minimal-2023',
});
// Feed the config into the generator's programmatic API.
```

## Android APK / AAB via Bubblewrap

```typescript
// scripts/generate-twa-manifest.ts
import { writeFileSync } from 'node:fs';
import { getBubblewrapConfig } from '@stackra/pwa/twa';

const manifest = getBubblewrapConfig({
  host: 'app.stackra.com',
  name: 'Stackra',
  launcherName: 'Stackra',
  manifestUrl: 'https://app.stackra.com/manifest.webmanifest',
  startUrl: '/',
  themeColor: '#0EA5E9',
  backgroundColor: '#FFFFFF',
  iconUrl: 'https://app.stackra.com/pwa-512.png',
  maskableIconUrl: 'https://app.stackra.com/maskable-512.png',
  orientation: 'portrait',
  shortcuts: [{ name: 'Inbox', shortName: 'In', url: '/inbox' }],
});

writeFileSync('./twa-manifest.json', JSON.stringify(manifest, null, 2));
```

Then:

```bash
pnpm dlx @bubblewrap/cli init --manifest=./twa-manifest.json
pnpm dlx @bubblewrap/cli build
```

## Push notifications

Push notifications, in-app notification centres, and native push tokens have moved to their own package. See [`@stackra/notifications`](../notifications/README.md) for the full surface — Web Push subscription management, an in-app notification centre backed by `@stackra/storage`, Expo push tokens on native, HeroUI-based permission prompt + list + badge components, and a `testing/` subpath.

## Analytics events

`PwaService` emits every lifecycle event through the optional `IAnalyticsManager` (`ANALYTICS_MANAGER` token from `@stackra/contracts`). When `@stackra/analytics` is installed and imported at the app root, PWA events auto-flow through it — no adapter provider needed.

| Event                            | When it fires                                            |
| -------------------------------- | -------------------------------------------------------- |
| `pwa.install.prompt_shown`       | Browser fires `beforeinstallprompt`.                     |
| `pwa.install.accepted`           | User accepts the browser install prompt.                 |
| `pwa.install.dismissed`          | User dismisses the in-app banner or the browser prompt.  |
| `pwa.update.available`           | `registration.waiting` becomes non-null.                 |
| `pwa.update.accepted`            | User accepts the update prompt.                          |
| `pwa.update.dismissed`           | User dismisses the update banner.                        |
| `pwa.standalone.launched`        | App boots in standalone mode.                            |
| `pwa.offline.entered`            | Consumer reports offline via `PwaService.reportOffline`. |
| `pwa.storage.persistent.granted` | `navigator.storage.persist()` returns `true`.            |
| `pwa.storage.persistent.denied`  | `navigator.storage.persist()` returns `false`.           |

Import the canonical names from `PWA_EVENTS`.

## Configuration

```bash
cp node_modules/@stackra/pwa/config/pwa.config.ts src/config/pwa.config.ts
```

## Testing

```typescript
import {
  MockPwaService,
  MockBeforeInstallPromptEvent,
  MockAnalyticsClient,
  createMockPwa,
} from '@stackra/pwa/testing';

const pwa = createMockPwa({
  install: { isSupported: true, isVisible: true, dismissCount: 0 },
});
await pwa.promptInstall();
expect(pwa.$.wasCalled('promptInstall')).toBe(true);
```

## License

MIT © Stackra L.L.C
