# @stackra/cache

Client-side cache for the Stackra framework — Laravel-style Cache facade,
pluggable stores (memory, null, IndexedDB, localStorage), tag-based
invalidation, TTLs, and React bindings.

## Install

```bash
pnpm add @stackra/cache @stackra/container @stackra/contracts @stackra/logger @stackra/support reflect-metadata
```

## Quick start

```typescript
import { Module } from "@stackra/container";
import { CacheModule } from "@stackra/cache";

@Module({
  imports: [
    CacheModule.forRoot({
      default: "memory",
      stores: {
        memory: { driver: "memory" },
        null: { driver: "null" },
      },
      prefix: "app:",
      ttl: 3600,
    }),
  ],
})
export class AppModule {}
```

## Public API

### Injection

```typescript
import { Injectable, Inject } from "@stackra/container";
import { CACHE_MANAGER } from "@stackra/contracts";
import type { ICacheManager } from "@stackra/contracts";

@Injectable()
class UserService {
  constructor(@Inject(CACHE_MANAGER) private cache: ICacheManager) {}
}
```

### Core operations

```typescript
// Get with fallback
const user = await cache.get<User>("user:5");

// Get-or-compute (atomic, deduplicates concurrent callers)
const user = await cache.remember<User>("user:5", 3600, async () => {
  return await api.getUser(5);
});

// Set with TTL (seconds)
await cache.set("user:5", user, 3600);

// Set forever
await cache.forever("config:default", config);

// Existence
const hit = await cache.has("user:5");

// Delete
await cache.forget("user:5");

// Delete all
await cache.flush();
```

### Counters

```typescript
await cache.increment("pageviews"); // atomic +1
await cache.increment("pageviews", 5); // atomic +5
await cache.decrement("inventory:5", 1); // atomic -1
```

TTL is preserved across increments.

### Batch operations

```typescript
await cache.setMany(
  new Map([
    ["a", 1],
    ["b", 2],
  ]),
  120,
);

const results = await cache.many<number>(["a", "b", "missing"]);
// Map<string, number | undefined>
```

### TTL touch

Extend the expiration of an existing key without re-fetching the value:

```typescript
await cache.touch("session:abc123", 3600);
```

### Tagged caching

Group keys under tags and invalidate them together:

```typescript
await cache.tags(["users", "admins"]).set("user:5", user, 3600);
await cache.tags(["users"]).flush(); // invalidates every user-tagged entry
```

### Named stores

```typescript
await cache.store("memory").set("foo", "bar");
await cache.store("indexeddb").set("persistent-key", payload, 86400);
```

## Stores

| Driver      | Persistence                       | Notes                                                                |
| ----------- | --------------------------------- | -------------------------------------------------------------------- |
| `memory`    | In-process Map                    | Lost on reload. Fastest.                                             |
| `null`      | None                              | Every read returns undefined. For disabling cache in tests.          |
| `storage`   | `localStorage` / `sessionStorage` | Persistent across reloads, ~5 MB limit. Serialized as JSON.          |
| `indexeddb` | IndexedDB                         | Persistent, large capacity, async. Best for big datasets.            |
| Custom      | Anything                          | Implement `ICacheStore` and register via `CacheModule.forFeature()`. |

Custom store:

```typescript
import { Injectable } from "@stackra/container";
import { CacheStore, type ICacheStore } from "@stackra/cache";

@CacheStore({ name: "redis" })
@Injectable()
class RedisCacheStore implements ICacheStore {
  async get(key: string) {
    /* ... */
  }
  async set(key: string, value: unknown, ttl?: number) {
    /* ... */
  }
  async delete(key: string) {
    /* ... */
  }
  async clear() {
    /* ... */
  }
  // …
}

CacheModule.forFeature("redis", RedisCacheStore);
```

### Decorators

```typescript
import { Cacheable, CacheEvict } from "@stackra/cache";

@Injectable()
class UserService {
  @Cacheable({ key: (id) => `user:${id}`, ttl: 3600 })
  async getUser(id: number): Promise<User> {
    /* ... */
  }

  @CacheEvict({ key: (u) => `user:${u.id}` })
  async updateUser(u: User): Promise<void> {
    /* ... */
  }
}
```

## React bindings — `@stackra/cache/react`

```tsx
import { useCache, useCachedQuery } from "@stackra/cache/react";

function UserPanel({ id }: { id: number }) {
  const { data, loading } = useCachedQuery(
    ["user", id],
    () => api.getUser(id),
    { ttl: 3600 },
  );

  if (loading) return <Spinner />;
  return <UserCard user={data} />;
}
```

## Events

Every cache mutation emits on the shared `EVENT_EMITTER` bus (if configured):

```typescript
import { CACHE_EVENTS } from "@stackra/contracts";

events.on(CACHE_EVENTS.HIT, ({ key, store }) => metrics.count("cache.hit"));
events.on(CACHE_EVENTS.MISS, ({ key, store }) => metrics.count("cache.miss"));
events.on(CACHE_EVENTS.WRITTEN, ({ key, store, ttl }) => {});
events.on(CACHE_EVENTS.FORGOTTEN, ({ key, store }) => {});
events.on(CACHE_EVENTS.FLUSHED, ({ store }) => {});
events.on(CACHE_EVENTS.INCREMENTED, ({ key, store, by, value }) => {});
events.on(CACHE_EVENTS.DECREMENTED, ({ key, store, by, value }) => {});
events.on(CACHE_EVENTS.TOUCHED, ({ key, store, ttl, success }) => {});
```

## Testing helper — `@stackra/cache/testing`

```typescript
import { createMockCache } from "@stackra/cache/testing";

const cache = createMockCache();
const store = cache.store();
await userService.getUser(5); // internally does store.remember('user:5', ttl, fetcher)

// Fluent assertion DSL
cache.$.assertCalled("store").once();
store.$.assertCalled("set").with("user:5", { id: 5, name: "Ada" }).once();

// Or use the predicate API with your test framework
expect(store.$.wasCalledWith("get", "user:5")).toBe(true);
```

Mocks fully implement `ICacheManager` and `ICacheStore` — data written with
`set()` can be read back with `get()` so consumer code exercises real
cache-aside logic.

## Configuration

```bash
cp node_modules/@stackra/cache/config/cache.config.ts src/config/cache.config.ts
```

## Subpaths

| Import                   | Purpose                                                                             |
| ------------------------ | ----------------------------------------------------------------------------------- |
| `@stackra/cache`         | `CacheModule`, `Cacheable`, `CacheEvict`, `@CacheStore`, `MemoryStore`, `NullStore` |
| `@stackra/cache/react`   | React hooks                                                                         |
| `@stackra/cache/testing` | `createMockCache()`                                                                 |

## License

MIT
