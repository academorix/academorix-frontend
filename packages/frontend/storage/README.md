# @stackra/storage

Unified KV storage layer for the Stackra framework.

One `IStorage` contract. Pluggable drivers per platform. A
`MultipleInstanceManager` for named instances so an app can host
several concurrent storage stores (preferences, session, offline,
secure) each backed by a different driver.

## Why

Before this package, every feature package that needed to persist a
small blob of data (`consent`, `scope`, `state`, `i18n`, `auth`, …)
shipped its own `LocalStorageXAdapter` and `AsyncStorageXAdapter`
implementations. That's eight variants of the same code — and eight
call sites to update when the shape changes.

`@stackra/storage` replaces every one of them with one contract, one
manager, and platform-specific drivers registered per subpath.

## Install

```sh
pnpm add @stackra/storage
```

Optional peers (install only what you use):

```sh
# IndexedDB driver
pnpm add dexie

# React Native driver
pnpm add @react-native-async-storage/async-storage
```

## Web setup

```typescript
import { WebStorageModule } from '@stackra/storage/react';

@Module({
  imports: [
    WebStorageModule.forRoot({
      default: 'preferences',
      stores: {
        preferences: { driver: 'localStorage', prefix: 'app:prefs' },
        session: { driver: 'sessionStorage', prefix: 'app:session' },
        offline: { driver: 'indexedDB', database: 'app-offline' },
      },
    }),
  ],
})
export class AppModule {}
```

## Native setup

```typescript
import { NativeStorageModule } from '@stackra/storage/native';

@Module({
  imports: [
    NativeStorageModule.forRoot({
      default: 'preferences',
      stores: {
        preferences: { driver: 'asyncStorage', prefix: 'app:prefs' },
      },
    }),
  ],
})
export class AppModule {}
```

## Consume

```typescript
import { Inject } from '@stackra/container';
import { STORAGE, type IStorage } from '@stackra/contracts';

class PreferencesService {
  constructor(@Inject(STORAGE) private readonly storage: IStorage) {}

  async loadTheme(): Promise<string> {
    return (await this.storage.get<string>('theme')) ?? 'light';
  }

  async saveTheme(theme: string): Promise<void> {
    await this.storage.set('theme', theme);
  }
}
```

Need a different named instance? Inject the manager:

```typescript
import { STORAGE_MANAGER, type IStorageManager } from '@stackra/contracts';

class OfflineCache {
  constructor(@Inject(STORAGE_MANAGER) private readonly storage: IStorageManager) {}

  save<T>(key: string, value: T): Promise<void> {
    return this.storage.instance('offline').set(key, value, { ttlSeconds: 3600 });
  }
}
```

## The `IStorage` contract

```typescript
interface IStorage {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T, options?: { ttlSeconds?: number }): Promise<void>;
  delete(key: string): Promise<void>;
  clear(): Promise<void>;
  has(key: string): Promise<boolean>;
  keys(): Promise<string[]>;
}
```

Every method returns a `Promise`. Sync backing stores (localStorage,
sessionStorage) wrap results in `Promise.resolve(...)` so consumer
code never branches on backing store. Missing / expired entries
resolve to `null`.

## React hooks

```tsx
import { useStorage, useStorageValue } from '@stackra/storage/react';

function ThemeToggle() {
  const [theme, setTheme] = useStorageValue<string>('theme', {
    instance: 'preferences',
    initialValue: 'light',
  });

  return (
    <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
      Switch to {theme === 'dark' ? 'light' : 'dark'}
    </button>
  );
}
```

## Testing

```typescript
import { createMockStorageManager, MockStorage } from '@stackra/storage/testing';

const manager = createMockStorageManager();
await manager.instance().set('key', 'value');
expect(await manager.instance().get('key')).toBe('value');
```

## Design decisions

- **Promise-first `IStorage`** — one uniform shape across sync and
  async backing stores. Consumers never branch.
- **TTL at the driver level** — every driver wraps values in a
  `{ v, e? }` envelope. Manager stays value-agnostic.
- **Drivers register via `manager.extend(...)`** from subpath modules
  (`WebStorageModule`, `NativeStorageModule`). The core package is
  platform-agnostic; only `memory` + `null` live in `src/core`.
- **Named instances** — the manager hosts several `IStorage` instances
  side-by-side, each backed by its own driver. This is the same
  `MultipleInstanceManager<T>` pattern `@stackra/cache`, `@stackra/http`,
  and `@stackra/queue` follow.

## License

MIT © Stackra L.L.C
