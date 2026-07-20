# @stackra/devtools

Enterprise developer overlay for the Stackra framework — a Nuxt-DevTools-inspired workspace-wide launcher pill, drawer/panel shell, DI-driven panel contribution via `@DevtoolsPanel` + `forFeature`, inspector overlay, keyboard shortcut, HeroUI Pro (web) + HeroUI Native Pro (native) UI, and a testing subpath with in-memory mocks. Tree-shakes to zero bytes in production.

## What ships

- **Runtime (DI + React)** — `DevtoolsModule` binds a `DevtoolsPanelsRegistry` (cross-package panel registry, last-wins per id, `useSyncExternalStore`-safe), a `DevtoolsInspectorRegistry` (regional overlay registry), a `DevtoolsFrameStateService` (open state / position / size / active panel — persisted through `@stackra/storage` when present), a `DevtoolsAnalyticsService` (fires `DEVTOOLS_EVENTS.*` on the shared `EVENT_EMITTER`), plus two discovery loaders (`DevtoolsPanelsLoaderService` + `DevtoolsInspectorLoaderService`) that scan the container at `onApplicationBootstrap`.
- **Decorators + contribution API** — `@DevtoolsPanel(options)` stamps a class with `DEVTOOLS_PANEL_METADATA_KEY` and applies `@Injectable()`; `@DevtoolsInspectorSource(options)` does the same for inspector regions. `DevtoolsModule.forFeature([Panel])` / `DevtoolsModule.forInspectorSource([Source])` seed additional contributions via the shared `createSeedLoader` from `@stackra/support`.
- **HeroUI Pro components (web)** — `Devtools` (top-level mount), `DevtoolsLauncher` (floating pill), `DevtoolsShell` (resizable drawer with a categorised nav rail, search, position menu, keyboard shortcut binding), `DevtoolsPanelFrame` / `DevtoolsPanelView` / `DevtoolsPanelLocked` / `DevtoolsPanelEmpty`, `DevtoolsInspectorOverlay` + `DevtoolsInspectorToolbar`. Built-in `overview` + `actions` panels ship with the package.
- **HeroUI Native Pro components (native)** — `Devtools` (top-level mount), `DevtoolsLauncher` (bottom-right pill), `DevtoolsShell` (HeroUI Native `BottomSheet` with a horizontal chip nav rail), `DevtoolsPanelFrame` / `DevtoolsPanelView` / `DevtoolsPanelLocked`, plus native `OverviewPanel` + `ActionsPanel` mirrors. `DevtoolsProvider` mirrors the web contract minus the inspector overlay + keyboard shortcut.
- **React hooks** — `useDevtoolsContext`, `useDevtoolsPanels`, `useDevtoolsPanel` (ad-hoc registration), `useDevtoolsFrameState`, `useDevtoolsShortcut`, `useDevtoolsSearch`, `useDevtoolsInspector`, `useDevtoolsEnabled`, `useDevtoolsAuthGuard` — every reader over the DI singleton via `useSyncExternalStore` for tearing-free reads under concurrent React. Native mirrors: `useNativeDevtoolsContext`, `useNativeDevtoolsPanels`, `useNativeDevtoolsFrameState`, `useNativeDevtoolsEnabled`.
- **Auth gate** — every panel can declare `requireAuth: { ability, resource?, message? }`. The shell resolves the optional `AUTH_SERVICE` from `@stackra/auth` and renders `DevtoolsPanelLocked` when the caller is denied. Fails **open** when `@stackra/auth` is absent — devtools is a dev aid, not a hard security boundary.
- **Testing** — `MockDevtoolsPanelsRegistry`, `MockDevtoolsInspectorRegistry`, plus `createMockDevtoolsPanel`, `createMockDevtoolsRegistry`, `createMockInspectorRegistry` assertable factories in `@stackra/devtools/testing`.

## Install

```bash
pnpm add @stackra/devtools @stackra/container @stackra/contracts \
         @stackra/support reflect-metadata
# React bindings + HeroUI-based components (web):
pnpm add @stackra/ui react react-dom
# React Native bindings + HeroUI Native Pro components:
pnpm add @stackra/ui heroui-native heroui-native-pro react-native
# Optional peers (each enables extra Actions rows / persistence):
pnpm add @stackra/storage @stackra/events @stackra/logger \
         @stackra/analytics @stackra/auth
```

`@stackra/storage` powers frame-state persistence (open state, active panel id, position, size). `@stackra/events` powers the `DEVTOOLS_EVENTS.*` fan-out. `@stackra/auth` powers the panel `requireAuth` gate. Every optional peer is missing-safe — the shell degrades gracefully.

## Bootstrap — web

```typescript
import { Module } from '@stackra/container';
import { WebStorageModule } from '@stackra/storage';
import { DevtoolsModule } from '@stackra/devtools';

@Module({
  imports: [
    WebStorageModule.forRoot({
      default: 'localStorage',
      stores: { localStorage: { driver: 'localStorage' } },
    }),
    DevtoolsModule.forRoot({
      // `enabled` defaults to `!Env.isProduction()` — production
      // builds tree-shake the shell out via constant-folding.
      position: 'right',
      initialSize: 480,
      shortcut: { meta: true, shift: true, key: 'd' },
    }),
  ],
})
export class AppModule {}
```

Mount the shell at the top of your React tree:

```tsx
import { Devtools } from '@stackra/devtools/react';

export function AppRoot(): JSX.Element {
  return (
    <>
      <RouterOutlet />
      <Devtools />
    </>
  );
}
```

## Bootstrap — native

```typescript
import { Module } from '@stackra/container';
import { NativeStorageModule } from '@stackra/storage/native';
import { DevtoolsModule } from '@stackra/devtools';

@Module({
  imports: [
    NativeStorageModule.forRoot({
      default: 'asyncStorage',
      stores: { asyncStorage: { driver: 'asyncStorage' } },
    }),
    DevtoolsModule.forRoot({
      storage: 'asyncStorage',
    }),
  ],
})
export class AppModule {}
```

Mount the shell alongside your navigator:

```tsx
import { Devtools } from '@stackra/devtools/native';

export function App(): JSX.Element {
  return (
    <>
      <RootNavigator />
      <Devtools />
    </>
  );
}
```

## Contributing a panel

Any package can contribute a panel through the `@DevtoolsPanel` decorator + `DevtoolsModule.forFeature([PanelClass])`. The class implements the `IDevtoolsPanel` contract from `@stackra/contracts`.

The `view` field is a tagged union — pick the shape that matches your panel's job.

### `type: 'component'` — full-fidelity React panel

```tsx
import { createElement } from 'react';
import { Injectable } from '@stackra/container';
import { DevtoolsPanel } from '@stackra/devtools';
import type { IDevtoolsPanel, IDevtoolsView } from '@stackra/contracts';
import { NetworkDevtoolsPanelBody } from './network-devtools-panel-body';

@Injectable()
@DevtoolsPanel({ id: 'network', title: 'Network', category: 'network', order: 10 })
export class NetworkDevtoolsPanel implements IDevtoolsPanel {
  public readonly id = 'network';
  public readonly title = 'Network';
  public readonly category = 'network' as const;
  public readonly view: IDevtoolsView = {
    type: 'component',
    render: () => createElement(NetworkDevtoolsPanelBody),
  };
}
```

### `type: 'action'` — a stack of one-shot actions

```typescript
import { Injectable } from '@stackra/container';
import { DevtoolsPanel } from '@stackra/devtools';
import type { IDevtoolsPanel, IDevtoolsView } from '@stackra/contracts';

@Injectable()
@DevtoolsPanel({ id: 'cache', title: 'Cache', category: 'data' })
export class CacheDevtoolsPanel implements IDevtoolsPanel {
  public readonly id = 'cache';
  public readonly title = 'Cache';
  public readonly category = 'data' as const;
  public readonly view: IDevtoolsView = {
    type: 'action',
    actions: [
      {
        id: 'clear-cache',
        label: 'Clear all caches',
        description: 'Empty every registered @stackra/cache instance.',
        variant: 'danger',
        requireConfirmation: true,
        handle: async () => cacheManager.clearAll(),
      },
    ],
  };
}
```

### `type: 'iframe'` — sandboxed external tool

```typescript
public readonly view: IDevtoolsView = {
  type: 'iframe',
  src: 'https://my-diagnostics.example.com/dashboard',
};
```

Wire the panel into your feature module:

```typescript
@Module({
  imports: [DevtoolsModule.forFeature([NetworkDevtoolsPanel])],
})
export class NetworkModule {}
```

The panel appears in the shell's nav rail at bootstrap. Auto-discovery via the `@stackra/container/discovery` module works too — every `@DevtoolsPanel`-decorated class in the container is picked up by `DevtoolsPanelsLoaderService.onApplicationBootstrap()`.

## Component inspector

Feature packages that render regions on the page (routes, scopes, error boundaries, layout slots) can contribute inspector regions through `@DevtoolsInspectorSource`:

```typescript
import { Injectable } from '@stackra/container';
import { DevtoolsInspectorSource } from '@stackra/devtools';
import type { IDevtoolsInspectorRegionSource, IDevtoolsInspectorRegion } from '@stackra/contracts';

@Injectable()
@DevtoolsInspectorSource({ id: 'scope', panelId: 'scope', label: 'Scope regions' })
export class ScopeInspectorSource implements IDevtoolsInspectorRegionSource {
  public readonly id = 'scope';
  public readonly label = 'Scope regions';
  public readonly panelId = 'scope';

  public collect(): readonly IDevtoolsInspectorRegion[] {
    return Array.from(document.querySelectorAll('[data-scope]')).map((el, i) => ({
      id: `scope-${i}`,
      label: (el as HTMLElement).dataset.scope ?? `scope-${i}`,
      panelId: 'scope',
      // Snapshot form is cheap and works with SSR-rendered nodes.
      bounds: (el as HTMLElement).getBoundingClientRect(),
    }));
  }
}

@Module({
  imports: [DevtoolsModule.forInspectorSource([ScopeInspectorSource])],
})
export class ScopeModule {}
```

Toggling the inspector overlay from the shell toolbar renders every region as an outlined box; clicking activates the owning panel and closes the overlay. Escape closes it without activating a panel.

## Auth gate

Any panel can gate itself behind an ability:

```typescript
@DevtoolsPanel({ id: 'sensitive', title: 'Sensitive', category: 'app' })
export class SensitiveDevtoolsPanel implements IDevtoolsPanel {
  public readonly id = 'sensitive';
  public readonly title = 'Sensitive';
  public readonly category = 'app' as const;
  public readonly requireAuth = {
    ability: 'view-devtools:sensitive',
    message: 'Requires the elevated devtools role.',
  };
  public readonly view: IDevtoolsView = {
    type: 'component',
    render: () => <SensitivePanelBody />,
  };
}
```

The shell renders `DevtoolsPanelLocked` in place of the panel body when the gate denies access. Deny paths:

- `unauthenticated` — `authService.isAuthenticated` reads false → the locked screen offers a "Sign in" affordance.
- `forbidden` — `authService.can(ability, resource)` reads false → the locked screen shows a "Contact admin" message.

**Missing `@stackra/auth`** — the gate fails **open** (the panel renders). Devtools is not a hard security boundary; the gate is a soft dev-experience filter.

## Built-in panels

| Id         | Category | What it does                                                                                                                                                                                                                                                   |
| ---------- | -------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `overview` | `pinned` | Stat cards for total panels, inspector sources, session uptime, node env.                                                                                                                                                                                      |
| `actions`  | `pinned` | Maintenance actions: clear caches, drain queues, reset scopes, dump state, copy DI graph, reload page. Optional dependencies (`@stackra/cache`, `@stackra/queue`, `@stackra/scope`, `@stackra/state`, container discovery) each disable their row when absent. |

Both panels are registered by `DevtoolsProvider` on mount — a feature package that ships an overview / actions panel with the same id transparently overrides the built-in (last-wins on the registry).

## Testing

```typescript
import {
  createMockDevtoolsRegistry,
  createMockDevtoolsPanel,
  MockDevtoolsPanelsRegistry,
} from '@stackra/devtools/testing';

const registry = new MockDevtoolsPanelsRegistry();
registry.register(createMockDevtoolsPanel({ id: 'my-panel' }));
expect(registry.list()).toHaveLength(1);

// AssertableProxy for behaviour assertions:
const proxy = createMockDevtoolsRegistry();
proxy.register(createMockDevtoolsPanel({ id: 'a' }));
expect(proxy.$.wasCalledWith('register', expect.anything())).toBe(true);
```

## Events

Every UI-level event fans out through the optional `IEventEmitter` (`EVENT_EMITTER` token from `@stackra/contracts`). Consumers who ship `@stackra/events` receive every event automatically.

| Event                                      | When it fires                                      |
| ------------------------------------------ | -------------------------------------------------- |
| `DEVTOOLS_EVENTS.SHELL_OPENED`             | The user opens the shell (drawer or bottom sheet). |
| `DEVTOOLS_EVENTS.SHELL_CLOSED`             | The user closes the shell.                         |
| `DEVTOOLS_EVENTS.PANEL_REGISTERED`         | A panel joins the registry.                        |
| `DEVTOOLS_EVENTS.PANEL_UNREGISTERED`       | A panel leaves the registry.                       |
| `DEVTOOLS_EVENTS.PANEL_ACTIVATED`          | A panel becomes the active viewport.               |
| `DEVTOOLS_EVENTS.INSPECTOR_ENABLED`        | The inspector overlay is toggled on.               |
| `DEVTOOLS_EVENTS.INSPECTOR_DISABLED`       | The inspector overlay is toggled off.              |
| `DEVTOOLS_EVENTS.INSPECTOR_REGION_CLICKED` | The user clicks an inspector region.               |
| `DEVTOOLS_EVENTS.ACTION_TRIGGERED`         | A panel action fires (`{ panelId, actionId }`).    |

## License

MIT © Stackra L.L.C
