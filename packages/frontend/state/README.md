# @stackra/state

Reactive state management for the Stackra framework — DI-managed
[TanStack Store](https://tanstack.com/store) instances with optimistic
mutations, cross-tab sync, realtime updates, and persistence.

`@stackra/state` owns the **global-state / store** leg. The store-backed **query
/ server-state** leg lives in the companion [`@stackra/query`](../query)
package, which builds on this one.

## Install

```bash
pnpm add @stackra/state @tanstack/store @tanstack/react-store
```

## Subpaths

| Import                   | Contents                                                        |
| ------------------------ | --------------------------------------------------------------- |
| `@stackra/state`         | `StateModule`, `StateRegistry`, broadcasters, adapters, `Store` |
| `@stackra/state/react`   | `useStore`, `useStoreValue`, `useStoreDispatch`                 |
| `@stackra/state/testing` | `createMockStateRegistry`, `MockStateRegistry`                  |

> **Writes live in [`@stackra/query`](../query).** Optimistic store writes and
> server writes both go through `useMutation` there — `@stackra/state` owns
> reads and the store engine. For a purely local store write with no server
> call, use `useStoreDispatch`.

## Quick start

```typescript
import { Module } from "@stackra/container";
import { StateModule } from "@stackra/state";
import { THEME_STORE } from "@stackra/contracts";

@Module({
  imports: [
    StateModule.forRoot(),
    StateModule.forFeature({
      name: "theme",
      token: THEME_STORE,
      initialState: { mode: "system" },
      crossTab: true,
      persistence: "localStorage",
    }),
  ],
})
export class AppModule {}
```

Read reactively from React:

```tsx
import { useStore, useStoreDispatch } from "@stackra/state/react";
import { THEME_STORE } from "@stackra/contracts";

function ThemeToggle() {
  const mode = useStore<ThemeState, string>(THEME_STORE, (s) => s.mode);
  const dispatch = useStoreDispatch<ThemeState>(THEME_STORE);

  return (
    <Button
      onPress={() =>
        dispatch((s) => ({ ...s, mode: s.mode === "light" ? "dark" : "light" }))
      }
    >
      {mode}
    </Button>
  );
}
```

For optimistic writes that persist to a server, use `useMutation` from
`@stackra/query` with its `optimistic` option.

## Reactive capabilities

`StateModule.forFeature()` accepts the full `IStoreFeatureConfig` from
`@stackra/contracts`:

| Option           | Default          | Effect                                                               |
| ---------------- | ---------------- | -------------------------------------------------------------------- |
| `optimistic`     | `false`          | Enable optimistic mutation support.                                  |
| `crossTab`       | `true`           | Sync state across browser tabs (BroadcastChannel).                   |
| `realtime`       | `false`          | Apply WebSocket updates from `@stackra/realtime`.                    |
| `persistence`    | `"localStorage"` | Persist to `localStorage` / `sessionStorage`, or `false`.            |
| `updateStrategy` | `"instant"`      | How realtime updates land (`instant`/`prompt`/`manual`/`next-open`). |

## Testing

```ts
import { createMockStateRegistry } from "@stackra/state/testing";

const registry = createMockStateRegistry();
registry.registerStore("theme", THEME_STORE, store);
expect(registry.getNames()).toContain("theme");
expect(registry.$.wasCalled("registerStore")).toBe(true);
```

## License

MIT © Stackra L.L.C
