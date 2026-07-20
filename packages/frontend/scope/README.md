# @stackra/scope

Client-side hierarchical **scope** runtime for the Stackra framework — the
active-scope store, **emulation**, cascading value resolution, and React
bindings. Backend-agnostic: it talks to _your_ API through a data source; it
never touches a database.

> The authoritative scope platform (hierarchy definitions, materialized-path
> node graph, cascading value store, authorisation) lives on the **backend**.
> This client package _consumes_ a resolved scope and drives the UX. The package
> ships in a 100% client world — React (web) today, React Native next.

## Install

```bash
pnpm add @stackra/scope @stackra/container @stackra/contracts reflect-metadata
# for React bindings + the HeroUI-based switcher:
pnpm add @stackra/ui react
```

## Concepts

- **Scope** — "where am I" in the tenant hierarchy (owner → venue → team,
  configurable per deployment). Resolved by the backend; opaque on the client.
- **Emulation** — temporarily view/act within a _different_ scope node while
  keeping **your own identity + permissions** (Magento-style store emulation).
  Distinct from **impersonation** (acting as a different _user_). The client
  swaps the active scope, flags `emulated: true`, and surfaces an "Exit"
  affordance; the backend authorizes and enforces the data scoping.
- **Node tree vs. definition tree** — the _node tree_ is the tree of concrete
  instances the current user can switch to ("Downtown Venue", "Team Alpha"); the
  _definition tree_ is the schema of levels (owner → venue → team). The runtime
  service tracks the node tree; the definition tree stays a design-time concern
  via the pure `buildTree()` util.

## Data source (the backend bridge)

Implement `IScopeDataSource` to connect the client to your API:

```typescript
import type { IScopeDataSource, IScopeNodeTreeNode } from "@stackra/scope";

export class HttpScopeDataSource implements IScopeDataSource {
  constructor(private api: ApiClient) {}

  resolveScope(nodeId: string) {
    return this.api.get(`/scope/${nodeId}`);
  }

  loadTree(): Promise<IScopeNodeTreeNode[]> {
    return this.api.get("/scope/tree");
  }

  resolveValue(nodeId: string, ns: string, key: string) {
    return this.api.get(`/scope/${nodeId}/values/${ns}/${key}`);
  }

  persist(scope) {
    localStorage.setItem("scope", scope.nodeId);
  }
}
```

`loadTree()` returns the tree of switchable _nodes_ — each carries the `id` the
switcher passes back to `setScope`.

## Wire the module (DI)

```typescript
import { Module } from "@stackra/container";
import { ScopeModule } from "@stackra/scope";

@Module({
  imports: [
    ScopeModule.forRoot({
      dataSource: new HttpScopeDataSource(api),
      initialScope: scopeFromServer, // optional — seed first paint
      initialTree: treeFromServer, // optional — skip the initial fetch
    }),
  ],
})
export class AppModule {}
```

`ScopeModule` registers the injectable `ScopeService` under `SCOPE_SERVICE`.

## Hooks

```tsx
import { useScope, useScopeValue, useScopeTree } from "@stackra/scope/react";

function Toolbar() {
  const { scope, isEmulating, setScope, emulate, restore } = useScope();
  const prefix = useScopeValue<string>("settings", "invoice.prefix");
  const tree = useScopeTree();

  return (
    <>
      <span>
        {scope?.level}: {scope?.entityId} — invoice prefix {prefix ?? "INV-"}
      </span>
      {isEmulating && <button onClick={restore}>Exit emulation</button>}
    </>
  );
}
```

Hooks resolve the DI `ScopeService` via `useInject` and read from it through
`useSyncExternalStore` for tearing-free rendering under concurrent React.

## `<ScopeSwitcher>`

A HeroUI-based (`@stackra/ui`) switcher — built on `ComboBox`, so the scope list
is **searchable/filterable** — that lists the switchable nodes and switches (or
emulates) the active scope:

```tsx
import { ScopeSwitcher } from '@stackra/scope/react';

<ScopeSwitcher label="Scope" className="w-64" />
<ScopeSwitcher label="View as" emulateOnSelect />   // emulation mode
```

Each row's `id` is the value the switcher passes to `setScope` / `emulate`; the
backend authorises and returns the resolved context.

## Service API

```typescript
scope.getScope(); // IScopeContext | null
scope.getTree(); // readonly IScopeNodeTreeNode[]
scope.getSnapshot(); // IScopeSnapshot (stable identity)
scope.isLoading(); // boolean
scope.isEmulating(); // boolean
await scope.setScope(nodeId);
await scope.emulate(nodeId);
scope.restore();
await scope.resolveValue(namespace, key);
scope.subscribe(() => {
  /* re-render */
});
```

## Utilities

- `parseMaterializedPath('/a/b/c')` → `['c','b','a']` (self → root).
- `buildTree(definitions)` → nested `IScopeDefinitionTreeNode[]` (design-time
  helper).
- `defineConfig({...})` — typed config helper.

## Testing

```ts
import {
  createMockScopeService,
  createMockScopeDataSource,
} from "@stackra/scope/testing";

const service = createMockScopeService({
  scope: fixtureScope,
  tree: fixtureNodes,
});
const source = createMockScopeDataSource({
  scopes: { "node-venue-1": fixtureScope },
  tree: fixtureNodes,
});
```

Both factories return an `AssertableProxy` (from `@stackra/testing`) so you can
assert on call names + arguments without wiring `vi.spyOn` yourself.

## Configuration

```bash
cp node_modules/@stackra/scope/config/scope.config.ts src/config/scope.config.ts
```

## React Native (`@stackra/scope/native`)

Mobile bindings ship in the `./native` subpath:

```bash
pnpm add @stackra/scope @stackra/container @stackra/contracts \
         @stackra/ui react react-native reflect-metadata
# optional — enables scope persistence across app restarts
pnpm add @react-native-async-storage/async-storage
```

```typescript
import { Module } from "@stackra/container";
import {
  NativeScopeModule,
  AsyncStorageScopePersistAdapter,
  NativeScopeSwitcher,
} from "@stackra/scope/native";

// Optional: read the persisted node id before wiring the module so
// the first paint reopens on the same scope.
const persist = new AsyncStorageScopePersistAdapter();
const nodeId = await persist.restore();
const dataSource = new HttpScopeDataSource(api);
const initialScope = nodeId ? await dataSource.resolveScope(nodeId) : null;

@Module({
  imports: [
    NativeScopeModule.forRoot({
      dataSource,
      initialScope,
      // persistAdapter defaults to a fresh AsyncStorageScopePersistAdapter;
      // pass `false` to disable persistence entirely, or your own
      // IScopePersistAdapter for tests.
      persistAdapter: persist,
    }),
  ],
})
export class AppModule {}
```

Cross-platform hooks (`useScope`, `useScopeTree`, `useScopeValue`) are
re-exported from `@stackra/scope/native` so a native app can import everything
scope-related from one subpath.

### `<NativeScopeSwitcher>`

HeroUI Native's `Select` compound (bottom sheet on phones by default;
`presentation="popover" | "dialog"` for tablet / desktop layouts):

```tsx
import { NativeScopeSwitcher } from '@stackra/scope/native';

<NativeScopeSwitcher label="Scope" />
<NativeScopeSwitcher label="View as" emulateOnSelect />
<NativeScopeSwitcher label="Scope" presentation="popover" />
```

The switcher iterates the same `useScope().tree` the web `ScopeSwitcher` does
and calls the same `setScope(node.id)` / `emulate(node.id)` service actions —
mobile parity for scope switching + emulation with a Chip + Exit affordance when
emulating.

## License

MIT © Stackra L.L.C
