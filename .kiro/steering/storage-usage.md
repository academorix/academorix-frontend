# Storage Usage

Rules for how any workspace package (and any app inside the workspace) persists
data. There is one canonical persistence layer — `@stackra/storage` — and
application code MUST use it instead of calling `localStorage`,
`sessionStorage`, `indexedDB`, or `AsyncStorage` APIs directly.

Read alongside `code-standards.md` (where storage-consuming files live),
`browser-safe-imports.md` (why browser APIs need SSR guards), and
`support-utilities.md` (the sibling policy for string / array / number / URL /
env helpers).

## Rule — always persist through `@stackra/storage`

Every source file that writes to or reads from a browser or React Native storage
substrate resolves the substrate through `@stackra/storage` — never through the
native API directly.

### Canonical surface

| Concern                                  | Use                                                          | Home                       |
| ---------------------------------------- | ------------------------------------------------------------ | -------------------------- |
| Get a named storage instance from DI     | `useInject<IStorageManager>(STORAGE_MANAGER).instance(name)` | `@stackra/storage`         |
| Read a named storage instance from React | `useStorage(name)`                                           | `@stackra/storage/react`   |
| Register a new driver                    | `@Storage(...)` decorator on a class implementing `IStorage` | `@stackra/storage`         |
| Test-scoped in-memory storage            | `MockStorage` (implements `IStorage`, backed by `Map`)       | `@stackra/storage/testing` |

### The instances the workspace's default catalog ships

`WebStorageModule.forRoot(...)` and `NativeStorageModule.forRoot(...)` bind the
following instance names by default (consumers override / add via config):

| Instance name    | Driver                                                                                                                 | Runtime          |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------- | ---------------- |
| `localStorage`   | `LocalStorageDriver` — wraps `window.localStorage`                                                                     | Web              |
| `sessionStorage` | `SessionStorageDriver` — wraps `window.sessionStorage`                                                                 | Web              |
| `indexedDB`      | `IndexedDbDriver` — wraps Dexie (IndexedDB)                                                                            | Web              |
| `asyncStorage`   | `AsyncStorageDriver` — wraps `@react-native-async-storage/async-storage`                                               | Native           |
| `memory`         | `MemoryDriver` — a `Map<string, unknown>`                                                                              | Any (tests, SSR) |
| `cookie`         | `CookieStore` — wraps `document.cookie` with SSR guards, `Max-Age` / `Path` / `SameSite` flags, and prefix namespacing | Web              |
| `null`           | `NullDriver` — every call is a no-op                                                                                   | Any (opt-out)    |

Every driver implements the same `IStorage` contract from `@stackra/contracts`
(`get / set / remove / clear / has / keys / size / subscribe`). The instance
name is a string identifier the consumer chooses at boot; the underlying driver
is a config-selected implementation.

## Rule — do NOT touch the native storage APIs directly

- **No** `localStorage.getItem(...)` / `.setItem(...)` / `.removeItem(...)` /
  `.clear()` / `.key(i)` / `.length` on the browser's global `Storage` API.
- **No** `sessionStorage.<method>` — same reason.
- **No** `indexedDB.open(...)` / `IDBDatabase` / `IDBObjectStore` / raw Dexie
  construction outside the `@stackra/storage` driver package.
- **No** `AsyncStorage.getItem(...)` / `.setItem(...)` from
  `@react-native-async-storage/async-storage` outside the `@stackra/storage`
  native driver.
- **No** hand-rolled `class MyLocalStorageWrapper` that shims the browser API.
  Use `IStorage`.
- **No** `document.cookie` — cookies go through `@stackra/storage`'s
  `CookieStore` (`manager.instance('cookie')` / `useStorage('cookie')`). The
  store handles SSR guards, prefix namespacing, `Max-Age`, `Path`, `SameSite`
  flags, and the read/parse loop. Direct `document.cookie` reads or writes
  bypass the manager's subscribe / clear semantics and drift on SSR — every hit
  is a violation.

### Migration pattern

```typescript
// WRONG — direct localStorage access.
class SettingsService {
  public get(key: string): string | null {
    return localStorage.getItem(`settings:${key}`);
  }
  public set(key: string, value: string): void {
    localStorage.setItem(`settings:${key}`, value);
  }
}

// RIGHT — inject the manager, resolve an instance.
@Injectable()
class SettingsService {
  public constructor(
    @Inject(STORAGE_MANAGER) private readonly storage: IStorageManager,
  ) {}

  public async get(key: string): Promise<string | null> {
    return this.storage.instance("localStorage").get<string>(`settings:${key}`);
  }
  public async set(key: string, value: string): Promise<void> {
    await this.storage.instance("localStorage").set(`settings:${key}`, value);
  }
}
```

React consumers use the hook instead of the token:

```typescript
// packages/collaboration/src/hooks/use-notifications/use-notifications.hook.ts
export function useNotifications(): IUseNotificationsResult {
  const storage = useStorage("localStorage");
  // …
}
```

## Rule — legitimate exemptions

The rule has EXACTLY ONE structural exemption class. Any file that takes the
exemption MUST carry a top-of-function or top-of-block comment naming the
constraint that forces the exemption.

### Exemption 1 — synchronous cross-tab compare-and-swap (CAS)

`IStorage.get/set/remove` returns `Promise<T>`. Between the
`await storage.get(key)` resolving and the subsequent `storage.set(key, ...)`
firing, another tab could observe the old value and both tabs would think they
hold the same lock — the async wrapper breaks the CAS atomicity assumption.

Cross-tab lock coordination genuinely requires SYNCHRONOUS storage.
`localStorage`'s bare API IS synchronous; `IStorage` cannot be. The canonical
case:

```typescript
// packages/coordinator/src/core/services/lock-manager.service.ts
//
// Direct localStorage access is INTENTIONAL and deliberately
// bypasses IStorage. Two reasons:
//   1. localStorage's synchronous, unwrapped shape gives the
//      compare-and-swap primitive the atomicity guarantees the lock
//      manager needs — neither localStorage nor IStorage provide
//      true atomicity, but sync CAS is the closest analogue.
//   2. This code path ONLY fires when the Web Locks API is
//      unavailable (P1.h fallback).
private cas(key: string, expectedValue: string): boolean {
  if (typeof localStorage === "undefined") return false;
  const raw = localStorage.getItem(key);
  // …
}
```

To claim this exemption:

1. **Block-level comment** naming the sync-semantics constraint. The comment
   MUST explain WHY sync is required — reviewers reject unexplained exemptions.
2. **`typeof localStorage === "undefined"` guard** on every branch (SSR-safe,
   per `browser-safe-imports.md`).
3. **`try/catch` swallow** for private-mode / disabled-storage throws, matching
   the `@stackra/storage` drivers' fail-soft policy.
4. **Fallback path only** — the primary path uses the modern API (Web Locks,
   BroadcastChannel, SharedWorker — whichever gives real atomicity). Direct
   `localStorage` is the "older browsers / Safari private mode" branch, not the
   happy path.

### Non-exemptions (do NOT bypass)

Common temptations that DON'T qualify:

- **"Just for auth tokens"** — no. Auth tokens use `IStorage` too. The auth
  layer wires a dedicated instance name (`auth`) with a `SecureStore` driver on
  native and `localStorage` on web.
- **"Just for the theme preference"** — no. `ThemeService` uses `IStorage`.
- **"Just for a debug flag"** — no. Debug flags use `Env.get(...)` for
  build-time (per `support-utilities.md`) or `IStorage` for runtime-mutable.
- **"Just for Iconify's icon cache"** — Iconify's internal cache is its own
  concern; that IS `localStorage.setItem(...)` inside Iconify's own code
  (outside the workspace). Consumers importing Iconify inherit the write —
  that's the third-party's contract, not a workspace violation.
- **"Just for testing"** — tests use `MockStorage` from
  `@stackra/storage/testing`, or mount `MemoryDriver` via
  `WebStorageModule.forRoot({ default: 'memory', stores: { memory: { driver: 'memory' } } })`.
  Direct `localStorage` in test code bypasses the manager's subscribe / clear
  semantics that the production code depends on.

## Rule — the `@stackra/storage` package internals are exempt

The `@stackra/storage` package itself IMPLEMENTS the drivers. Its `src/**/*.ts`
files call `localStorage.getItem(...)` etc. inside their driver classes — that's
the whole point of the package.

- `packages/storage/src/core/drivers/*.driver.ts` — every driver wraps its
  native substrate.
- `packages/storage/src/react/*.ts` — the React hook implementations.
- `packages/storage/src/native/*.ts` — the AsyncStorage driver.
- `packages/storage/src/testing/*.ts` — `MockStorage` (in-memory).

These files are the OWNERS of the substrate contract. They are exempt by
definition; no in-file comment required.

## Rule — string literals naming instances are NOT violations

The workspace routinely uses the string literals `"localStorage"` /
`"sessionStorage"` / `"indexedDB"` / `"asyncStorage"` / `"memory"` as **instance
identifiers** — the string passed to `manager.instance(name)` or
`useStorage(name)`.

```typescript
// This is NOT a violation — the string is an instance ID.
const store = useStorage("localStorage");
const raw = await manager.instance("sessionStorage").get("cache:x");

// Config discriminators are also NOT violations.
export interface INotificationCentreConfig {
  readonly storage: "localStorage" | "sessionStorage" | "asyncStorage";
}
```

The literal is a lookup key into the manager's driver registry, not an API call.
Reviewers should NOT flag these.

## Rule — docblock text references are NOT violations

Docblocks that describe the underlying substrate ("cached in localStorage by
Iconify", "falls back to sessionStorage when session: true") are documentation,
not code. The audit greps for CODE calls (`localStorage.getItem(`,
`sessionStorage.setItem(`, etc.), not prose.

## Enforcement

Zero-hit greps (excluding `packages/storage/**` and exempt lines):

- `\blocalStorage\.[a-z]` — every hit is either exempt (with a
  `// <exemption reason>` comment above the block) or a violation. Cast a wide
  net — includes `localStorage.getItem` / `.setItem` / `.removeItem` / `.clear`
  / `.key` / `.length`.
- `\bsessionStorage\.[a-z]` — same.
- `\bwindow\.localStorage\b` / `\bwindow\.sessionStorage\b` — same API surface,
  different accessor. Zero hits.
- `\bindexedDB\.open\(` — direct IndexedDB access outside `@stackra/storage`.
  Zero hits.
- `\bdocument\.cookie\b` — direct cookie access outside
  `packages/storage/src/**` and grandfathered exceptions. Zero hits in new code.
  `packages/i18n/src/react/resolvers/cookie.resolver.ts` predates the
  `CookieStore` promotion and is grandfathered; migrating it to
  `useStorage('cookie')` is a follow-up.
- `import\s+.*from\s+["']dexie["']` outside `packages/storage/src/**` — direct
  Dexie usage. Zero hits.
- `import\s+.*from\s+["']@react-native-async-storage/async-storage["']` outside
  `packages/storage/src/native/**` — direct AsyncStorage import. Zero hits.

Every exemption carries a review-attributable comment. Reviewers who find an
unexplained direct-storage call reject the PR and ask for the migration to
`IStorage` or the exemption comment.

## When you're tempted

- **"But `IStorage` is async and I want sync."** Fair — 99% of state reads don't
  need synchronous atomicity, but yours might. If you're reaching for sync
  semantics because you're implementing a CAS primitive, take Exemption 1.
  Otherwise, `await` the async call — the observable difference is a single
  microtask.

- **"But `localStorage.setItem` is one line vs three lines of DI plumbing."** DI
  plumbing lands once in the constructor; every read/write call site is still
  one line (`storage.get(key)`). The win is not brevity — it's the abstraction
  that lets a driver swap (localStorage → IndexedDB, in-memory in tests,
  encrypted at rest, audit-logged, etc.) without touching call sites.

- **"But it's just this ONE place."** It always is. One place becomes twelve
  places over time, each independently reinventing key namespacing /
  serialisation / SSR guards / fallback behavior. `IStorage` centralises all
  four concerns.

- **"But the browser API is well-known."** So is the seatbelt. Consistency beats
  familiarity when the abstraction handles cross-cutting concerns (subscribe
  events, size limits, quota errors, private-mode failures) the raw API doesn't.

## Cross-references

- `code-standards.md` — where storage-consuming files live in packages.
- `browser-safe-imports.md` — SSR guards on
  `typeof localStorage === "undefined"`.
- `communication-patterns.md` — Lane 1 (DI) is how consumers reach
  `STORAGE_MANAGER`.
- `support-utilities.md` — sibling policy for other native APIs (Str, Arr, Num,
  Uri, Env).
- `discovery-vs-loader.md` — how discoverable drivers auto-register.
