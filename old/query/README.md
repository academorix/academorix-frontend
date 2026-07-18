# @academorix/query

React Query primitives + Refine data adapter for the Academorix workspace:
`createQueryClient()` factory, `defineResource<TRecord>()` hook generator, a
Laravel query-builder serialiser, and `createRefineRestDataProvider()` — a
Refine `DataProvider` bound to `@academorix/http`.

Depends on `@academorix/core`, `@academorix/http`, and peer-depends on
`@tanstack/react-query` + React 19. Does **not** depend on `@refinedev/core` —
the Refine surface is exposed via structural types so this package can be reused
from non-Refine consumers.

## Public API

| Subpath                        | Exports                                                                                                                                                                         |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `@academorix/query/client`     | `createQueryClient(options)`, `CreateQueryClientOptions`                                                                                                                        |
| `@academorix/query/resource`   | `defineResource<TRecord, TId>(resource, { client, queryKeyPrefix? })`, `ResourceDefinition`, `ResourceListParams`, `ResourceListResult`, `ResourceHooks`, `serializeListParams` |
| `@academorix/query/query-keys` | `listKey`, `oneKey`, `manyKey`, `buildQueryKey`, `DEFAULT_QUERY_KEY_PREFIX`, `ResourceOperation`                                                                                |
| `@academorix/query/laravel`    | `serializeLaravelQuery(input)`, `LaravelQueryInput`, `LaravelFilter`, `LaravelFilterOperator`, `LaravelSorter`, `LaravelListPagination`                                         |
| `@academorix/query/refine`     | `createRefineRestDataProvider(client, options?)`, `RefineDataProvider`, `HttpClientLike`, plus the structural mirror of Refine v5's data-provider types                         |

Root barrel re-exports the most common symbols.

## When to use this

- **Landing page** — uses `defineResource` directly for its 2 marketing forms
  (contact, waitlist). Refine's ~180 KB bundle earns nothing on an SSG site.
- **Dashboard** — keeps Refine as the primary data layer. Its `dataProvider` is
  a thin wrapper around
  `createRefineRestDataProvider(httpClient, { apiPrefix: "/v1" })` — same
  transport as the landing page, same query keys, same envelope handling.
- **Admin / future surfaces** — either flavour works; the two barrels share the
  underlying serialiser (`serializeLaravelQuery`), so query strings are
  byte-identical across consumers.

## Usage

### 1. Create one QueryClient per app

```tsx
// apps/landing-page/src/app/providers.tsx
"use client";

import { createQueryClient } from "@academorix/query/client";
import { QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => createQueryClient());

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}
```

### 2a. Declare a resource (landing / non-Refine surfaces)

```ts
// apps/landing-page/src/api/waitlist.resource.ts
import { defineResource } from "@academorix/query/resource";

import { httpClient } from "@/lib/http";

export interface WaitlistEntry {
  id: string;
  email: string;
  source: string;
  created_at: string;
}

export const waitlistResource = defineResource<WaitlistEntry>(
  { path: "marketing/waitlist" },
  { client: httpClient },
);

// Usage:
// const { data } = waitlistResource.useList({ page: 1, per_page: 25 });
// const { mutateAsync } = waitlistResource.useCreate();
// await mutateAsync({ email: "user@example.com" });
```

### 2b. Wire the Refine data provider (dashboard)

```ts
// apps/dashboard/src/providers/data/index.ts
import { createRefineRestDataProvider } from "@academorix/query/refine";

import { httpClient } from "@/lib/http";

export const dataProvider = createRefineRestDataProvider(httpClient, {
  apiPrefix: "/v1",
});
```

## Default query client behaviour

- `staleTime: 30s` — read-through cache for chatty CRUD screens without
  over-fetching.
- `gcTime: 5m` — keep cache entries warm across route changes.
- `refetchOnWindowFocus: false` — realtime updates come through
  `@academorix/realtime`; tab-focus refetches are distracting for a data-heavy
  admin app.
- `retry: (failureCount, error)` — retry twice on 5xx, twice on transport
  failures (no HTTP status), never on 4xx.

Override any of these by passing `defaults` to `createQueryClient` —
consumer-supplied fields merge over the built-ins.

## Laravel wire format

`serializeLaravelQuery({ pagination, sorters, filters, include })` turns
Refine-style state into a
[spatie/laravel-query-builder v7](https://spatie.be/docs/laravel-query-builder/v7/introduction)
`URLSearchParams`:

- `page=<n>&per_page=<size>` when pagination is enabled.
- `sort=-created_at,name` — descending prefix, comma-joined.
- `include=branch,team` — spatie `AllowedInclude`.
- Native operators (`eq`, `eqs`, `contains`, `containss`, `in`, `ina`) emit
  `filter[field]=value` (server-side `AllowedFilter` decides exact vs partial).
- Every other operator emits `filter[field][op]=value` for a custom spatie
  filter.
- Presence operators (`null`, `nnull`) carry a sentinel `1`.

## Query-key convention

Every generated hook uses:

```
[prefix, resourcePath, operation, ...params]
```

- Invalidate everything for a resource:
  `queryClient.invalidateQueries({ queryKey: ["@academorix", "athletes"] })`.
- Invalidate one specific record:
  `queryClient.invalidateQueries({ queryKey: oneKey("@academorix", "athletes", id) })`.

Downstream integrations (`createRefineRestDataProvider`) use the same
`serializeLaravelQuery` internals so mutations from either the hook surface or
Refine flow through consistent wire semantics.
