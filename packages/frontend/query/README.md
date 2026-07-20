# @stackra/query

TanStack Query-backed data fetching for the Stackra framework, with three
Stackra-specific add-ons:

1. **DI-native.** `QueryClient` + `QueryService` are bound in the container.
   Non-React consumers (action handlers, SSR loaders, background workers) inject
   `QUERY_CLIENT` and get the same cache the React hooks use.
2. **`liveMode` realtime invalidation.**
   `useQuery({ liveMode: 'auto', liveChannel: 'themes' })` subscribes to
   `@stackra/realtime` events and calls `queryClient.invalidateQueries` on every
   message.
3. **Three mutation modes.** `useMutation({ mutationMode })` supports
   `'pessimistic'` (default), `'optimistic'` (auto-rollback on throw), and
   `'undoable'` (Gmail-style countdown with cancel, coordinated by
   `UndoableQueueService`).

Under the hood: `@tanstack/query-core` + `@tanstack/react-query` (v5).

## Install

```bash
pnpm add @stackra/query @stackra/container @stackra/contracts \
  @tanstack/query-core @tanstack/react-query
```

Optional peers: `@stackra/state` (for state-store writes), `@stackra/realtime`
(for `liveMode`), `@stackra/actions` (for the shipped action handlers).

## Subpaths

| Import                   | Contents                                                                                 |
| ------------------------ | ---------------------------------------------------------------------------------------- |
| `@stackra/query`         | `QueryModule`, `QueryService`, `UndoableQueueService`, tokens                            |
| `@stackra/query/react`   | `<StackraQueryProvider>`, `useQuery`, `useMutation`, `useLiveSubscription`, `usePublish` |
| `@stackra/query/actions` | `QueryHandler`, `RefreshHandler`                                                         |
| `@stackra/query/testing` | `MockQueryClient` for handler tests                                                      |

## Quick start

```typescript
import { Module } from "@stackra/container";
import { QueryModule } from "@stackra/query";

@Module({
  imports: [
    QueryModule.forRoot({
      defaultStaleTime: 5 * 60 * 1000,
      defaultMutationMode: "optimistic",
      defaultLiveMode: "auto",
    }),
  ],
})
export class AppModule {}
```

React tree:

```tsx
import { ContainerProvider } from "@stackra/container/react";
import { StackraQueryProvider } from "@stackra/query/react";

<ContainerProvider context={app}>
  <StackraQueryProvider>
    <YourApp />
  </StackraQueryProvider>
</ContainerProvider>;
```

## `useQuery`

```tsx
import { useQuery } from "@stackra/query/react";

function ThemeList() {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["themes"],
    fetcher: () => api.listThemes(),
  });

  if (isLoading) return <Spinner />;
  if (error) return <ErrorDisplay error={error} onRetry={refetch} />;
  return (
    <ul>
      {data?.map((t) => (
        <li key={t.id}>{t.label}</li>
      ))}
    </ul>
  );
}
```

Optional state-store write (for cross-app reactive reads via `useSelector`):

```tsx
useQuery(THEMES_STORE, {
  queryKey: ["themes"],
  fetcher: () => api.listThemes(),
});
```

Auto-invalidate on a realtime channel:

```tsx
useQuery({
  queryKey: ["themes"],
  fetcher: () => api.listThemes(),
  liveMode: "auto",
  liveChannel: "themes",
});
```

## `useMutation`

```tsx
import { useMutation } from "@stackra/query/react";

// Pessimistic (default) — wait for server before updating UI.
const { mutate, isPending } = useMutation({
  mutationFn: (creds) => authService.login(creds),
});

// Optimistic — write locally now, roll back on error.
const { mutate } = useMutation({
  mutationFn: (theme) => api.saveTheme(theme),
  mutationMode: "optimistic",
  optimistic: { store: themeStore, apply: (_, next) => next },
});

// Undoable — Gmail-style "undo send" with countdown.
const { mutate } = useMutation({
  mutationFn: (id) => api.deleteThread(id),
  mutationMode: "undoable",
  undoableTimeout: 5000,
  undoableLabel: "Thread deleted",
  optimistic: {
    store: threadsStore,
    apply: (s, id) => ({ ...s, items: s.items.filter((t) => t.id !== id) }),
  },
  onCancel: (cancel) => showUndoToast({ onUndo: cancel }),
});
```

## Non-React usage

```typescript
import { QUERY_CLIENT, type IQueryClient } from "@stackra/contracts";

class ThemeService {
  constructor(
    @Inject(QUERY_CLIENT) private readonly queryClient: IQueryClient,
  ) {}

  async loadThemes(): Promise<Theme[]> {
    return this.queryClient.fetch(["themes"], async () => api.listThemes());
  }

  async invalidate(): Promise<void> {
    await this.queryClient.invalidate(["themes"]);
    // Every active useQuery(['themes']) hook refetches.
  }
}
```

## License

MIT © Stackra L.L.C
