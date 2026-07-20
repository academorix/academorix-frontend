# @stackra/testing

Shared Vitest preset, setup lifecycle, and assertable primitives for every
`@stackra/*` package. Solves the two hardest problems in Vitest 4: **decorator
metadata emission** and **DI reset between tests**.

## Install

```bash
pnpm add -D @stackra/testing vitest
```

## Why this exists

Vitest 4 defaults to OXC for TypeScript transformation. OXC does **not** emit
`design:paramtypes` reliably for forward-referenced classes, which means the DI
container gets `undefined` for constructor parameters and silently fails to
inject. This preset:

1. Disables OXC entirely (`oxc: false`, `esbuild: false`)
2. Wires `unplugin-swc` with legacy decorators + decorator metadata + class-name
   preservation
3. Provides a per-test container reset hook so tests can't leak singletons

## Vitest preset

```typescript
// vitest.config.ts
import { defineConfig, mergeConfig } from "vitest/config";
import path from "node:path";
import preset from "@stackra/testing/preset";

export default mergeConfig(
  preset,
  defineConfig({
    // CRITICAL — re-declare these at the top level. `mergeConfig` does
    // not preserve `oxc`/`esbuild` from the preset root, and without
    // both being false the SWC plugin isn't the sole transformer.
    oxc: false,
    esbuild: false,
    test: {
      environment: "node",
      setupFiles: ["./__tests__/vitest.setup.ts"],
    },
    resolve: {
      alias: { "@": path.resolve(__dirname, "./src") },
    },
  }),
);
```

Setup file:

```typescript
// __tests__/vitest.setup.ts
import "@stackra/testing/setup";
```

## Assertable primitives

Zero-dependency test doubles with call recording and assertion helpers:

```typescript
import { Assertable, createAssertableProxy } from "@stackra/testing";

// Wrap any real service so calls are recorded
const cache = createAssertableProxy(new InMemoryCache());
await cache.set("key", "value");
cache.assertCalled("set").with("key", "value").once();

// Build a class stub
class FakeApi extends Assertable {
  async fetch(url: string) {
    return this.record("fetch", [url], { data: "ok" });
  }
}
const api = new FakeApi();
await api.fetch("/users");
api.assertCalled("fetch").with("/users").once();
```

The `Assertable` base class exposes `.assertCalled(method)`,
`.assertNotCalled(method)`, `.calls(method)` and pattern-based matchers.
`createAssertableProxy` wraps arbitrary objects without needing to subclass.

## Time helpers

Freeze wall-clock time for deterministic TTL / cron / backoff tests:

```typescript
import { freezeTime, travelTo, restoreTime } from "@stackra/testing";

freezeTime("2025-01-01T00:00:00Z");
await cache.set("key", "value", 60); // 60s TTL

travelTo("2025-01-01T00:01:01Z"); // 61s later
expect(await cache.get("key")).toBeUndefined();

restoreTime(); // in afterEach
```

Wraps Vitest's fake timers with an ergonomic time-travel API. `restoreTime()`
also restores `Date.now()`, `performance.now()`, and all
`setTimeout`/`setInterval` timers.

## Custom matchers

```typescript
import { registerAllMatchers } from "@stackra/testing/matchers";

beforeAll(() => registerAllMatchers());

// Matchers currently shipped: (stub — add project-specific matchers here)
```

## Subpaths

| Import                      | Purpose                                    |
| --------------------------- | ------------------------------------------ |
| `@stackra/testing`          | Assertable primitives + time helpers       |
| `@stackra/testing/preset`   | Vitest config preset (default export)      |
| `@stackra/testing/setup`    | Setup file — import from `vitest.setup.ts` |
| `@stackra/testing/matchers` | `registerAllMatchers()`                    |

## License

MIT
