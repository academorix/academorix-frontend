# @academorix/query

React Query primitives for the Academorix workspace: `createQueryClient()`
factory with sensible defaults and `defineResource<TRecord>()` — a factory that
generates typed `useList` / `useOne` / `useCreate` / `useUpdate` / `useDelete`
hooks bound to an `@academorix/http` `HttpClient`.

Depends on `@academorix/core`, `@academorix/http`, and peer-depends on
`@tanstack/react-query` + React 19.

## Public API

| Subpath                        | Exports                                                                                                                                                                         |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `@academorix/query/client`     | `createQueryClient(options)`, `CreateQueryClientOptions`                                                                                                                        |
| `@academorix/query/resource`   | `defineResource<TRecord, TId>(resource, { client, queryKeyPrefix? })`, `ResourceDefinition`, `ResourceListParams`, `ResourceListResult`, `ResourceHooks`, `serializeListParams` |
| `@academorix/query/query-keys` | `listKey`, `oneKey`, `manyKey`, `buildQueryKey`, `DEFAULT_QUERY_KEY_PREFIX`, `ResourceOperation`                                                                                |

Root barrel re-exports everything.

## When to use this

- **Landing page** — uses `defineResource` directly for its 2 marketing forms
  (contact, waitlist). Refine's ~180 KB bundle earns nothing on an SSG site.
- **Dashboard** — keeps Refine as the primary data layer, but Refine's
  `dataProvider` is built on the same `@academorix/http` `HttpClient` and can
  reuse `@academorix/query`'s query keys for consistent invalidation across the
  two libraries.

Same transport, two consumption patterns.

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

### 2. Declare a resource

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
```

### 3. Use the generated hooks

```tsx
// apps/landing-page/src/components/onboarding/waitlist-form.tsx
"use client";

import { waitlistResource } from "@/api/waitlist.resource";

export function WaitlistForm() {
  const { mutateAsync, isPending, error } = waitlistResource.useCreate();

  async function onSubmit(email: string) {
    await mutateAsync({ email, source: "landing" });
  }

  return (
    <form onSubmit={/* ... */}>
      {/* ... */}
      {error ? <p>{error.message}</p> : null}
      <button disabled={isPending}>{isPending ? "Joining…" : "Join"}</button>
    </form>
  );
}
```

## Default query client behaviour

- `staleTime: 30s` — read-through cache for chatty CRUD screens without
  over-fetching.
- `gcTime: 5m` — keep cache entries warm across route changes.
- `refetchOnWindowFocus: false` — realtime updates come through
  `@academorix/realtime`; tab-focus refetches are distracting for a data-heavy
  admin app.
- `retry: (failureCount, error)` — retry once on 5xx, never on 4xx, twice on
  transport failures (no HTTP status).

Override any of these by passing `defaults` to `createQueryClient`.

## Query-key convention

Every generated hook uses:

```
[prefix, resourcePath, operation, ...params]
```

- Invalidate everything for a resource:
  `queryClient.invalidateQueries({ queryKey: ["@academorix", "athletes"] })`.
- Invalidate one specific record:
  `queryClient.invalidateQueries({ queryKey: oneKey("@academorix", "athletes", id) })`.

Downstream integrations (Refine's data provider on the dashboard) should use the
same keys so mutations from either side invalidate the same cache entries.
