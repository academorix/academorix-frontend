# `@stackra/routing` — package plan (v3)

A single package that owns the client-side routing surface for every
`@stackra/*` app: middleware, guards, SEO, analytics, breadcrumbs, route modes
(page / dialog / drawer / sheet), advanced matchers (subdomain / query /
header), history control, action-dispatched navigation, and a `defineRoute()`
builder that composes with React Router v7's native `prerender` for SEO-only
static output.

Replaces `@stackra/ssr` (which will be deleted). No runtime server. SSR is NOT
an option — `ssr: false` is hardcoded internally.

---

## v3 corrections (SUPERSEDES the corresponding sections below)

These thirteen decisions supersede anything earlier in the doc that contradicts.
The remainder of the plan is preserved for context but any conflicting section
should be re-read in light of these.

**Quick index:**

- **v3.1** — `definePage()` config helper. ONE Stackra-native shape. Framework
  extracts RRv7's exports under the hood.
- **v3.2** — `useAction<T, R>()` is the primitive. `<Link>` + `useNavigate()`
  are convenience wrappers.
- **v3.3** — Vite plugin `router()` covers what Vite CAN. `/etc/hosts` needs a
  separate script.
- **v3.4** — Matcher context is a single `IMatcherContext` object.
- **v3.5** — `onBack` accepts numeric offsets. Defaults when omitted.
- **v3.6** — Matcher builders — HYBRID (callback + direct import).
- **v3.7** — Guard `group` REMOVED. `@GlobalMiddleware` / `@GlobalGuard`
  shortcut decorators land.
- **v3.8** — AI integration (opt-in) — `navigateTool` in `@stackra/ai`,
  `useAiRouteContext` + `<AiRouteContext>` in `@stackra/routing/react`.
- **v3.9** — POST-REVIEW CRITICAL FIXES — `useAction` signature correction,
  prerender build pipeline spec, config trio, `defineEvents` re-export removed,
  `RoutingModule` signatures, contracts stays zero-dep (rrv7 subpath moves),
  `@stackra/actions` HARD peer, no deprecations.
- **v3.10** — FEATURE PARITY — port `<StackraRouter>` as
  `<StackraRoutingProvider>`, `attachMiddleware` internal, drop `@ApiRoute` /
  `ApiRouteRegistry` / `matchApiRoute` cold, port devtools contribution as
  `RoutingDevtoolsPanel` + `RoutingInspectorSource`.
- **v3.11** — PHASE-1 ADDITIONS — `defineLayout()`, `revalidate` (+ optional
  `@stackra/state` integration), `<Link prefetch>` modes, route-level `head`,
  testing helpers (`createTestRouter`, `mockNavigate`, `expectRoute`), per-route
  a11y announcer, `useRouteQueryState<T>()` (+ optional `@stackra/query`
  integration), new `@stackra/cli` package hosting `stackra dev-hosts`.
- **v3.12** — EDGE CASE RULES — overlapping matches, guard throws, `useNavigate`
  outside router, dialog-mode 404, CSP nonce during prerender, circular groups,
  build-time DI safety, scroll restoration, hydration mismatch on dynamic SEO.
- **v3.13** — INDEX FIXES — `./matchers` + `./rrv7` in exports, `defineEvents`
  removed from public API sample, `@Guard` samples updated for v3.7,
  `matchers/builders/` folder, `not(...)` on every matcher builder, verification
  checklist additions.

### v3.1 — `definePage()` config helper. ONE Stackra-native shape. Framework extracts RRv7's exports under the hood.

Previous drafts proposed either (a) separate exports with `generate*` factories,
or (b) aligning to RRv7's native `loader` / `meta` / `handle` naming. **Both
dropped.**

The correct pattern: users write in ONE Stackra-native shape via `definePage()`.
The framework's route adapter reads the module and produces the RRv7
`RouteObject` (with `loader`, `meta`, `handle`, `HydrateFallback`,
`ErrorBoundary`, etc.) under the hood — invisibly to consumers.

**Every page module has exactly two exports:**

- `default` — the React component.
- `page` — the unified `definePage()` config.

That's it. No `loader`, no `meta`, no `handle`, no `prerender`. Consumers learn
one shape.

**Canonical usage:**

```typescript
// apps/dashboard/src/pages/blog-post.tsx
import { definePage } from "@stackra/routing";
import { article } from "@stackra/routing/seo";
import { AuthGuard } from "@/guards";

export default function BlogPostPage() {
  // ...
}

export const page = definePage<IBlogPost>({
  // 1. Data loading — extracted to RRv7's `loader` under the hood.
  load: async ({ params }) => fetchBlogPost(params.slug),

  // 2. Prerender — extracted to RRv7's `prerender` at build time.
  prerender: async () => {
    const slugs = await fetchBlogSlugs();
    return slugs.map((slug) => ({ slug }));
  },

  // 3. SEO — richer than RRv7's `meta` (JSON-LD, canonical, OG images).
  //    Value OR function. Framework extracts basic fields into `meta`
  //    and renders the rest via <SeoHead />.
  seo: ({ data }) => ({
    title: data.title,
    description: data.excerpt,
    canonical: `/blog/${data.slug}`,
    jsonLd: [article({ headline: data.title /* ... */ })],
    openGraph: { images: [{ url: data.coverUrl }] },
  }),

  // 4. Breadcrumb — flows into RRv7's `handle.breadcrumb`.
  //    Value OR function.
  breadcrumb: ({ data }) => data.title,

  // 5. Analytics — typed against the app's event catalog.
  analytics: ({ data }) => ({
    name: "view_blog_post",
    properties: { slug: data.slug },
  }),

  // 6. Pipeline
  guards: [AuthGuard],
  middleware: ["@web"],

  // 7. Route slots — fallbacks for loading / error / not-found / empty.
  //    Component references — framework wires them into RRv7's shape.
  LoadingComponent: BlogPostSkeleton,
  ErrorComponent: BlogPostError,
  NotFoundComponent: BlogPostNotFound,
  EmptyComponent: BlogPostEmpty,
  isEmpty: (data) => !data || data.deletedAt != null,

  // 8. History
  history: { resetOnEnter: true },

  // 9. Mode + overlay (see §14)
  mode: "page",
});
```

**Under the hood — the framework's route adapter:**

```typescript
// packages/routing/src/react/adapt-page-module.util.ts (framework internals)
export function adaptPageModule(module: IPageModule): RouteObject {
  const { page, default: Component } = module;
  return {
    Component,
    loader: page.load,
    HydrateFallback: page.LoadingComponent,
    ErrorBoundary: page.ErrorComponent,
    // Extract basic <meta> fields from seo for RRv7's meta export.
    meta: (args) => extractBasicMetaTags(resolveValue(page.seo, args)),
    handle: {
      // RRv7's `handle` is a well-known metadata bag used by community
      // tooling (breadcrumbs, analytics). We colocate our fields here
      // too so `useMatches()` sees the full route metadata chain.
      breadcrumb: page.breadcrumb,
      analytics: page.analytics,
      [STACKRA_HANDLE]: {
        seo: page.seo,
        guards: page.guards,
        middleware: page.middleware,
        history: page.history,
        slots: {
          Pending: page.PendingComponent,
          Loading: page.LoadingComponent,
          Error: page.ErrorComponent,
          NotFound: page.NotFoundComponent,
          Empty: page.EmptyComponent,
        },
        isEmpty: page.isEmpty,
        mode: page.mode,
        overlay: page.overlay,
      },
    },
  };
}
```

`prerender` is handled separately at build time — the Vite plugin walks every
route module, calls `page.prerender()` on those that opt in, and generates
static output per RRv7 conventions.

**`resolveValue(x, ctx)`** — helper that unwraps `x` if it's a function, or
returns it as-is if it's a value. Used everywhere the config accepts "value or
function".

**Why this over "match RRv7 exactly":**

- **One shape to learn.** Users don't memorize which fields live in `meta` vs
  `handle` vs top-level exports.
- **Zero exposure to RRv7's internal naming.** If RRv7 renames `handle` →
  `metadata` in a future version, we absorb it; consumer code doesn't move.
- **Full type-safety.** `definePage<TData>()` types every callback — `load`
  returns `TData`, `seo({data})` receives `TData`, `breadcrumb({data})` receives
  `TData`, `isEmpty(data)` receives `TData`.
- **Extensibility without nesting.** Adding `history`, `guards`, `middleware`,
  `slots`, `mode` doesn't force nested lookups — they're all peer fields.
- **Static-first, dynamic-when-needed.** Same "value OR function" pattern RRv7
  uses, but consolidated into one config surface.

**Config context object — one `IPageContext<TData>` type:**

Every function-valued field in `definePage({...})` receives the same context:

```typescript
export interface IPageContext<TData, TParams = Record<string, string>> {
  readonly data: TData; // loader return value
  readonly params: Readonly<TParams>;
  readonly matches: readonly IMatchDescriptor[];
  readonly location: Location;
  readonly request: Request;
  readonly url: URL;
}
```

So `seo({data, params}) => {...}`, `breadcrumb({data}) => data.title`,
`analytics({data}) => {...}` all use the same signature. Learn one context type.

**Prerender context — different (build-time, no data):**

```typescript
export interface IPrerenderContext {
  readonly container: IApplication; // DI for services (CMS, DB)
}
```

Prerender runs at build time — there's no HTTP request, no loader data. DI
container is the only useful field.

**Full `IPageConfig<TData, TParams>` signature:**

```typescript
export interface IPageConfig<
  TData = unknown,
  TParams = Record<string, string>,
> {
  /** Data loader — receives {params, request}, returns TData. */
  readonly load?: (args: ILoaderArgs<TParams>) => Promise<TData> | TData;

  /** Static or dynamic list of param bags to prerender. */
  readonly prerender?:
    | boolean
    | ((
        ctx: IPrerenderContext,
      ) => Promise<readonly TParams[]> | readonly TParams[]);

  /** Richer SEO. Value OR (ctx) => value. */
  readonly seo?:
    ISeoDescriptor | ((ctx: IPageContext<TData, TParams>) => ISeoDescriptor);

  /** Breadcrumb text. Value OR (ctx) => value. */
  readonly breadcrumb?:
    string | ((ctx: IPageContext<TData, TParams>) => string);

  /** Analytics event. Value OR (ctx) => value. */
  readonly analytics?:
    IAnalyticsEvent | ((ctx: IPageContext<TData, TParams>) => IAnalyticsEvent);

  /** Guards evaluated before render. */
  readonly guards?: readonly IGuardRef[];

  /** Middleware pipeline. */
  readonly middleware?: readonly IMiddlewareRef[];

  /** Route slots — fallbacks. */
  readonly LoadingComponent?: ComponentType;
  readonly PendingComponent?: ComponentType;
  readonly ErrorComponent?: ComponentType<IErrorProps>;
  readonly NotFoundComponent?: ComponentType;
  readonly EmptyComponent?: ComponentType;
  readonly isEmpty?: (data: TData) => boolean;

  /** History control. */
  readonly history?: IRouteHistory;

  /** Route mode — page (default) / dialog / drawer / sheet. */
  readonly mode?: IRouteMode;
  readonly overlay?: IOverlayConfig;
}
```

**Type inference:**

```typescript
export const page = definePage<IBlogPost, { slug: string }>({
  load: async ({ params }) => fetchBlogPost(params.slug),
  //                                          ^ params: {slug: string} — from generic
  seo: ({ data }) => ({ title: data.title }),
  //     ^ data: IBlogPost — inferred
  breadcrumb: ({ data }) => data.title,
  //           ^ data: IBlogPost
  isEmpty: (data) => !data,
  //        ^ data: IBlogPost
});
```

**`defineRoute()` shares the same shape:**

For routes without a full page module (redirects, layout-only routes), the same
fields available in `definePage()` are also available on `defineRoute()`.
Consistency across both.

```typescript
defineRoute({
  path: "/dashboard",
  lazy: () => import("@/pages/dashboard"),
  // Can override fields set on the page module — or set them here if
  // there's no page module (layout-only route).
  guards: [AuthGuard],
  middleware: ["@authenticated"],
});
```

**Precedence:** `defineRoute` field > page module's `definePage` config >
inherited parent > framework default.

**Reflex check:** no `export const loader`, no `export const meta`, no
`export const handle`, no `export const prerender`. Framework never surfaces
RRv7's internal export names to consumers.

### v3.2 — `useAction<T, R>()` is the primitive. `<Link>` + `useNavigate()` are convenience wrappers.

Previous draft: `<Link>` and `useNavigate()` internally dispatch a
`NavigateAction`. That's still correct — but the primitive is
`useAction<TInput, TResult>(kind)` shipped by `@stackra/actions`, and the
routing hooks wrap it.

```typescript
// @stackra/actions/react — the primitive
export function useAction<TInput, TResult>(
  kind: string,
): {
  run: (input: TInput) => Promise<TResult>;
  isPending: boolean;
  error: Error | null;
  reset: () => void;
};

// @stackra/routing/react — convenience wrapper
export function useNavigate(): (
  to: string,
  opts?: INavigateOptions,
) => Promise<void> {
  const { run } = useAction<INavigateInput, void>("navigate");
  return (to, opts) => run({ to, ...opts });
}

// <Link> uses useNavigate() under the hood, same as before.
```

Consumers choose the surface that fits:

- Zero-boilerplate navigation → `<Link to="/foo">` or `useNavigate()`.
- Need `isPending` / `error` / cancel →
  `useAction<INavigateInput, void>('navigate')`.

Same primitive powers every other action (`toast`, `mutate`, `download`). One
hook to learn. `@stackra/actions` becomes the general action-dispatch layer;
`@stackra/routing` is one of its many consumers.

**What `@stackra/actions` gains:**

- `useAction<TInput, TResult>(kind: string)` — the primitive hook.
- `<ActionDispatcherProvider>` — bridges the DI container's dispatcher to the
  React tree.
- `NavigateAction` type + handler slot — canonical action kind for routing.

**What `@stackra/routing` gains:**

- `useNavigate()` — wraps `useAction('navigate')`.
- `<Link>` — uses `useNavigate()` under the hood.
- `useBack()`, `useCanGoBack()`, `useHistoryStack()` — history convenience
  hooks, all built on `useAction`.

### v3.3 — Vite plugin `router()` covers what Vite CAN. `/etc/hosts` needs a separate script.

Local subdomain setup is a shared concern. Splitting cleanly:

**`@stackra/routing/vite` — `router()` plugin does:**

- `server.host: '0.0.0.0'` +
  `server.allowedHosts: ['.localhost', ...configured]`
- Dev middleware that inspects `req.headers.host`, parses the subdomain against
  `rootDomain`, and exposes it via a virtual module
  (`virtual:stackra-routing/dev-subdomain`) the runtime imports
- `?_subdomain=` query override when `allowDevSubdomainQuery: true`
- Startup banner listing every registered subdomain

```typescript
// vite.config.ts
import { defineConfig } from "vite";
import { router } from "@stackra/routing/vite";

export default defineConfig({
  plugins: [
    router({
      rootDomain: "stackra.app",
      devMode: "localhost", // 'localhost' | 'hosts-file' | 'proxy'
      devSubdomains: ["admin", "tenant-alpha", "ops"], // banner only
      allowDevSubdomainQuery: false,
    }),
  ],
});
```

Startup banner example:

```
┌─ Stackra Routing ────────────────────────────────
│  Root:           stackra.app
│  Dev URL (root): http://localhost:5173
│  Subdomains (*.localhost — zero setup):
│    admin        → http://admin.localhost:5173
│    tenant-alpha → http://tenant-alpha.localhost:5173
│    ops          → http://ops.localhost:5173
└──────────────────────────────────────────────────
```

**`@stackra/routing/scripts/dev-hosts` — CLI does:**

For users who need real domain testing (`admin.local.stackra.app` etc.), we
ship `pnpm stackra dev-hosts` — a Node CLI that:

- Reads `RoutingModule.forRoot({rootDomain})` config
- Prints the exact `/etc/hosts` lines needed
- Optionally applies them (prompts for sudo, then appends idempotently)
- `pnpm stackra dev-hosts --remove` reverses the change

**What we CAN'T do** (nothing does — this is honest guidance):

- Modify DNS from a Vite plugin (needs root; plugin runs unprivileged)
- Register wildcard TLDs (OS-level concern)
- Install `dnsmasq` / `caddy` for the user

Recommendation: default `devMode: 'localhost'` — zero setup, native browser
support. Use `hosts-file` mode only when you need a real domain (SAML/OAuth
callbacks that reject `.localhost`, cookie-domain tests, etc.).

### v3.4 — Matcher context is a single `IMatcherContext` object.

Previous drafts destructured (`{subdomain, container}`). Locked v3 shape: one
`ctx` object with every field a matcher might reasonably want. Destructuring
stays available at the call site.

```typescript
export interface IMatcherContext {
  /** Parsed subdomain (`'admin'`) or `null` for apex domain. */
  readonly subdomain: string | null;
  /** Full hostname (`'admin.example.com'`). */
  readonly hostname: string;
  /** Pathname (`'/users/42'`). */
  readonly path: string;
  /** Parsed query string. */
  readonly query: URLSearchParams;
  /** Request headers. */
  readonly headers: Headers;
  /** URL hash (without the `#`). */
  readonly hash: string;
  /** Path params matched so far by parent chain. */
  readonly params: Readonly<Record<string, string>>;
  /** Full Request. Escape hatch for anything not exposed above. */
  readonly request: Request;
  /** Parsed URL — convenience over `new URL(request.url)`. */
  readonly url: URL;
  /** DI container — tenant lookups, feature flags, etc. */
  readonly container: IApplication;
}
```

Same context passed to every matcher (`subdomain`, `query`, `header`, `hash`,
`custom`). Users typically destructure just what they need:

```typescript
defineRoute({
  path: "/*",
  match: {
    subdomain: subdomain.notIn(["www", "admin"]),
    custom: async ({ subdomain: sub, container }) => {
      return container.get(TENANT_SERVICE).exists(sub);
    },
  },
});
```

### v3.5 — `onBack` accepts numeric offsets. Defaults when omitted.

Extend the type + document defaults:

```typescript
export type IHistoryOnBack =
  | "default" // don't intercept — let the browser handle back
  | "to-parent" // navigate to parent route in match chain
  | number // negative = router.go(N); positive = forward
  | string; // absolute path — router.navigate(path, {replace: true})

export interface IRouteHistory {
  readonly resetOnEnter?: boolean;
  readonly preventBack?: boolean;
  readonly onBack?: IHistoryOnBack;
  readonly keepScroll?: boolean;
  readonly scrollKey?: string;
}
```

**Default behavior when `onBack` is omitted:**

- `preventBack: true` + `onBack` unset → framework uses `'to-parent'` as the
  fallback so back-button never becomes a silent no-op.
- `preventBack: false` (or unset) → `onBack` is ignored; browser handles back
  natively.

**Semantics per form:**

| `onBack` value     | Behavior                                                |
| ------------------ | ------------------------------------------------------- |
| `'default'`        | No interception. Browser back works normally.           |
| `'to-parent'`      | Navigate to parent route. Fallback to `/` if no parent. |
| `-1`               | `router.go(-1)` — same as browser back.                 |
| `-2`               | `router.go(-2)` — skip one step (post-wizard success).  |
| `+1`               | `router.go(+1)` — forward. Rare but supported.          |
| `'/wizard/step-1'` | `router.navigate('/wizard/step-1', {replace: true})`.   |

**Programmatic version — `useBack()`:**

```typescript
export function useBack(fallback?: string | number): () => void;

// Examples
const back = useBack(); // browser back if possible, else '/'
const back = useBack("/dashboard"); // browser back if possible, else '/dashboard'
const back = useBack(-2); // go back 2 steps
```

`useBack()` calls `useCanGoBack()` first. If there's no history, falls back to
the arg. All wired through `useAction('navigate')` per v3.2.

### v3.6 — Matcher builders — HYBRID (callback + direct import).

Both forms supported. Both compile to the same predicate type. Consumer picks
per line based on which reads better.

**Callback form — no imports needed. Framework provides the builder.**

The `match` fields accept a `(builder) => predicate` shape. Each field's
callback receives the matching builder (`subdomain` for `match.subdomain`,
`query` for `match.query`, etc.):

```typescript
defineRoute({
  path: "/*",
  match: {
    subdomain: (s) => s.notIn(["www", "admin"]),
    query: (q) => q.has("preview"),
    header: (h) => h.equals("x-tenant", "stackra"),
    hash: (h) => h.startsWith("#/"),
    custom: async (ctx) =>
      ctx.container.get(TENANT_SERVICE).exists(ctx.subdomain),
  },
});
```

**Direct-import form — full power. Useful for composition + reuse.**

```typescript
import { subdomain, query, header } from "@stackra/routing/matchers";

// Reusable predicates
const nonAdmin = subdomain.notIn(["www", "admin"]);
const previewMode = query.has("preview");

defineRoute({
  path: "/*",
  match: {
    // Composition is cleaner with direct import
    subdomain: subdomain.and(
      subdomain.notIn(["www"]),
      subdomain.startsWith("tenant-"),
    ),
    query: previewMode,
  },
});

defineRoute({
  path: "/dashboard",
  match: {
    subdomain: nonAdmin, // reuse across routes
  },
});
```

**Semantic identity — the two forms produce the same predicate:**

```typescript
// These are equivalent:
match: {
  subdomain: (s) => s.notIn(["www"]);
}
match: {
  subdomain: subdomain.notIn(["www"]);
}
```

Framework normalises the callback form at route-registration time — no runtime
overhead.

**Recommendation:**

- **Callback** for simple one-liners inline in `defineRoute`. Zero imports.
- **Direct import** when composing (`and` / `or` / `not`) or reusing predicates
  across routes.

**Builder shapes — one interface per matcher target:**

```typescript
export interface ISubdomainMatchers {
  exact(name: string): ISubdomainPredicate;
  not(pred: ISubdomainPredicate | string): ISubdomainPredicate;
  oneOf(names: readonly string[]): ISubdomainPredicate;
  notIn(names: readonly string[]): ISubdomainPredicate;
  startsWith(prefix: string): ISubdomainPredicate;
  endsWith(suffix: string): ISubdomainPredicate;
  contains(fragment: string): ISubdomainPredicate;
  matching(regex: RegExp): ISubdomainPredicate;
  any(): ISubdomainPredicate; // has any subdomain
  none(): ISubdomainPredicate; // apex only
  and(...preds: ISubdomainPredicate[]): ISubdomainPredicate;
  or(...preds: ISubdomainPredicate[]): ISubdomainPredicate;
}

export interface IQueryMatchers {
  has(key: string): IQueryPredicate;
  missing(key: string): IQueryPredicate;
  equals(key: string, value: string): IQueryPredicate;
  oneOf(key: string, values: readonly string[]): IQueryPredicate;
  matching(key: string, regex: RegExp): IQueryPredicate;
  and(...preds: IQueryPredicate[]): IQueryPredicate;
  or(...preds: IQueryPredicate[]): IQueryPredicate;
}

export interface IHeaderMatchers {
  has(name: string): IHeaderPredicate;
  missing(name: string): IHeaderPredicate;
  equals(name: string, value: string): IHeaderPredicate;
  oneOf(name: string, values: readonly string[]): IHeaderPredicate;
  matching(name: string, regex: RegExp): IHeaderPredicate;
  and(...preds: IHeaderPredicate[]): IHeaderPredicate;
  or(...preds: IHeaderPredicate[]): IHeaderPredicate;
}

export interface IHashMatchers {
  exact(hash: string): IHashPredicate;
  startsWith(prefix: string): IHashPredicate;
  endsWith(suffix: string): IHashPredicate;
  contains(fragment: string): IHashPredicate;
  matching(regex: RegExp): IHashPredicate;
  empty(): IHashPredicate;
  present(): IHashPredicate;
  and(...preds: IHashPredicate[]): IHashPredicate;
  or(...preds: IHashPredicate[]): IHashPredicate;
}
```

**Public exports from `@stackra/routing/matchers`:**

```typescript
export const subdomain: ISubdomainMatchers;
export const query: IQueryMatchers;
export const header: IHeaderMatchers;
export const hash: IHashMatchers;

export type {
  ISubdomainPredicate,
  IQueryPredicate,
  IHeaderPredicate,
  IHashPredicate,
};
```

**Type inference in the callback form** — the builder param is fully typed
without imports:

```typescript
match: {
  subdomain: (s) => s.notIn(['www']), // s: ISubdomainMatchers — inferred
  query:     (q) => q.has('preview'), // q: IQueryMatchers
  header:    (h) => h.equals(...),    // h: IHeaderMatchers
  hash:      (h) => h.startsWith(...) // h: IHashMatchers
}
```

Framework types the callback param through the `match` field's shape. No
explicit type annotations needed on the lambda param.

### v3.7 — Guard `group` REMOVED. `@GlobalMiddleware` / `@GlobalGuard` shortcuts land.

**Guard `group` is removed** — the "Globals and groups" section below that
mentions `group` on `IGuardOptions` (and the `AuthGuard` example that carries
`group: '@authenticated'`) is superseded here.

**Rationale.** Guards compile down to middleware in the pipeline anyway.
Middleware groups can already **contain guard names** — the resolver treats
guards uniformly with middleware after the adapter runs. Bundling matters more
for middleware (session + csrf + audit + logger + rate-limit) than for guards
(usually 1-2 per route: auth + role).

**Locked contract:**

- `IMiddlewareOptions` still has `group?: string | readonly string[]`.
- `IGuardOptions` has NO `group` field.
- Middleware groups may reference guard names in their `middleware` list.

**Updated examples that supersede the older ones below:**

```typescript
// ❌ OLD (superseded — group on guards is gone)
@Guard({name: 'auth', priority: 1000, group: '@authenticated'})
export class AuthGuard implements ICanActivate { … }

// ✅ NEW — guards carry name + priority + global only
@Guard({name: 'auth', priority: 1000})
export class AuthGuard implements ICanActivate { … }

// Bundle at the middleware-group level. Group's `middleware` list
// may reference middleware AND guard names uniformly — resolver
// treats them the same.
export const authenticatedGroup = defineMiddlewareGroup({
  name: '@authenticated',
  middleware: ['session', 'auth', 'audit'], // 'auth' is a guard name
});

// Routes reference the group like any other middleware:
defineRoute({
  path: '/dashboard',
  middleware: ['@authenticated'],
});
```

**`@GlobalMiddleware` / `@GlobalGuard` shortcut decorators — landed.**

Ship both as thin wrappers stamping `global: true`. Zero-arg and options-form
supported:

```typescript
@GlobalMiddleware({name: 'audit', priority: 100})
//   ≡ @Middleware({name: 'audit', priority: 100, global: true})

@GlobalGuard({name: 'anti-csrf', priority: 1000})
//   ≡ @Guard({name: 'anti-csrf', priority: 1000, global: true})

// Name-only shortcut too:
@GlobalMiddleware('audit')
@GlobalGuard('anti-csrf')
```

Both live in `@stackra/decorators/routing`. Zero runtime difference — they stamp
the same metadata as `@Middleware({..., global: true})` /
`@Guard({..., global: true})`; the discovery loader reads it identically.

### v3.8 — AI integration (opt-in). `navigateTool` + `useAiRouteContext` + `<AiRouteContext>`.

Routing knows nothing about AI directly; every AI feature is opt-in and
decoupled via `@stackra/actions` (per v3.2).

**Additions to `@stackra/ai`:**

A canonical `navigateTool` — the AI agent auto-discovers it (it's
`@AiTool`-decorated) and can trigger navigation like any other action:

```typescript
// @stackra/ai/tools/navigate.tool.ts (shipped by @stackra/ai)
export const navigateTool = defineTool({
  name: "navigate",
  description: "Navigate the user to a route in the app.",
  schema: z.object({
    to: z.string().describe("Route path or URL to navigate to."),
    replace: z.boolean().optional(),
  }),
  execute: ({ to, replace }, { container }) => {
    const dispatcher = container.get(ACTION_DISPATCHER);
    return dispatcher.dispatch({ kind: "navigate", to, replace });
  },
});
```

The tool dispatches the same `NavigateAction` that `<Link>` and `useNavigate()`
dispatch (per v3.2), so AI navigations flow through the exact same audit /
guards / confirms pipeline as user navigations.

**Additions to `@stackra/routing/react`:**

- **`<AiRouteContext>`** — a React frame that registers the current route as an
  AI context frame via `@stackra/ai`. Exposes the path, params, loader data,
  breadcrumb chain, and current mode so the AI agent can answer "where am I?"
  and "what's on screen?" without app-specific glue.

- **`useAiRouteContext()`** — hook that returns the same context frame the
  provider registers. Consumers can inject route-specific hints into the agent's
  system prompt:

  ```tsx
  const { path, params, data, breadcrumb } = useAiRouteContext();
  ```

**Wiring — opt-in via `RoutingModule.forRoot({ai: true})`:**

- `ai: false` (default) → nothing wires. `@stackra/ai` stays fully absent.
- `ai: true` → framework auto-registers the `<AiRouteContext>` frame at the root
  of the routed tree, exposes `useAiRouteContext()`, and asks the AI container
  to bind `navigateTool`.

`@stackra/ai` is an **optional peer** of `@stackra/routing`. Apps that don't use
AI don't install it; nothing breaks.

**Zero coupling in the base case.** Every AI touch-point is behind the flag.

### v3.9 — POST-REVIEW CRITICAL FIXES

Corrections mandated by the `framework-core-builder` review. Everything in this
sub-section supersedes any conflicting earlier draft.

#### v3.9.1 — `useAction` signature correction

Earlier v3.2 sketch was **wrong**. The actual `@stackra/actions/react`
`useAction` takes a descriptor kind and returns a `run(descriptor)` that carries
the kind inside the descriptor:

```typescript
// Actual @stackra/actions/react shape:
useAction<D extends IActionDescriptor, R>(kind: D['kind']): {
  run: (descriptor: D, context?: IActionContext) => Promise<IActionResponse<R>>;
  isPending: boolean;
  error: Error | null;
  data: R | null;
  reset: () => void;
};
```

The `run` return value is `IActionResponse<R>` (never throws — carries
success/failure state). So `useNavigate()` wraps like this:

```typescript
// @stackra/routing/react — the correct wrapper
export function useNavigate(): (
  to: string,
  opts?: INavigateOptions,
) => Promise<IActionResponse<void>> {
  const { run } = useAction<INavigateAction, void>("navigate");
  return (to, opts) => run({ kind: "navigate", to, ...opts });
}

// Discarding failure — if consumers want the raw result:
export function useNavigateAction() {
  return useAction<INavigateAction, void>("navigate");
}
```

`useBack()`, `<Link>`, and the AI `navigateTool` all funnel through this exact
pattern — `run({kind: 'navigate', ...})`, never `run({...})` without the kind.

#### v3.9.2 — Prerender build pipeline

The SEO story hangs on this. Full spec:

**Build-time flow:**

1. **`react-router.config.ts` is the entry.** The `router()` Vite plugin reads
   `defineRouterConfig({basename?, routes})` from a well-known path
   (`./react-router.config.ts` relative to Vite root, override via
   `router({configFile: '...'})`).

2. **Route discovery.** Plugin walks the `routes` tree from the config,
   following every `defineRoute({lazy: () => import('@/pages/...')})` by
   evaluating the lazy import at build time. Vite is already set up to analyse
   static import specifiers, so `lazy: () => import('@/pages/blog-post')`
   resolves via the same alias config the app uses.

3. **Build-time DI container.** Plugin bootstraps
   `ApplicationFactory.create(AppModule)` using the app's module (path in
   `router({moduleFile: 'src/app.module.ts'})`). **Browser-only modules must be
   marked** — the plugin passes `platform: 'build'` in the container context so
   modules can conditionally register based on
   `if (env.get('STACKRA_PLATFORM') === 'build') return`. See the "build-time DI
   safety" note in v3.12.7.

4. **Prerender walk.** For every route module whose `page.prerender` is set:
   - If `page.prerender === true` → prerender with `params = {}` (single
     output).
   - If `page.prerender` is a function → invoke `page.prerender({container})`
     from v3.1's `IPrerenderContext`, receive `readonly TParams[]`, prerender
     one HTML output per param bag.
   - For each output: instantiate a memory router, call `page.load({params})`,
     construct the RRv7 route tree via `adaptPageModule`, render with
     `renderToString` into an HTML template, extract the head (from
     `<SeoHead />` server render), and write to `dist/<path>/index.html`.

5. **CSP nonce during prerender.** Use a placeholder token `__STACKRA_NONCE__`
   in the emitted HTML. Runtime replaces via a Vite/Express middleware (or the
   app's edge worker) with the request-scoped nonce.

6. **Subdomain outputs.** If any route matches on subdomain, the plugin emits
   per-subdomain directories (`dist/admin/`, `dist/tenant-x/`). Base deployment
   maps wildcard DNS to the appropriate directory.

**Implementation surface (plugin internals — informative, not
consumer-facing):**

```typescript
// packages/routing/src/vite/prerender.util.ts
export async function prerenderRoutes(
  config: IPrerenderConfig,
): Promise<IPrerenderResult> {
  const routes = await loadRoutes(config);
  const app = await bootstrapBuildContainer(config);
  const outputs: IPrerenderOutput[] = [];

  for (const route of walkRoutes(routes)) {
    const module = await evaluateLazy(route);
    const page = module.page;
    if (!page?.prerender) continue;

    const paramSets =
      typeof page.prerender === "boolean"
        ? [{}]
        : await page.prerender({ container: app });

    for (const params of paramSets) {
      const html = await renderPrerender(app, route, params, config);
      outputs.push({ path: buildOutputPath(route, params), html });
    }
  }

  return { outputs };
}
```

**Plugin responsibilities cleanly split:**

- `router()` plugin — dev server config, virtual subdomain module,
  `?_subdomain=` override, startup banner, **AND** the build-time
  `apply: 'build'` hook that runs `prerenderRoutes()`.
- `@react-router/dev` — NOT a dependency. We do our own prerender because the
  config shape is Stackra-native (`definePage`), not RRv7-native.

**Fail-soft rules:**

- A route whose `page.load` throws during prerender emits an error page (using
  the resolved `ErrorComponent`) rather than aborting the whole build.
- A `page.prerender` function that throws → aborts the build with a named error
  so CI catches it.

#### v3.9.3 — Config trio (mandated by `package-conventions.md`)

The routing module must ship the same three pieces every configurable module
has:

```typescript
// packages/routing/src/core/constants/default-routing-config.constants.ts
export const DEFAULT_ROUTING_CONFIG: IRoutingModuleOptions = {
  basename: "/",
  rootDomain: undefined,
  devMode: "localhost",
  allowDevSubdomainQuery: false,
  devSubdomains: [],
  ai: false,
  fallbacks: undefined,
  prerender: { enabled: true, outputDir: "dist" },
};

// packages/routing/src/core/utils/define-config.util.ts
export function defineConfig(
  config: IRoutingModuleOptions,
): IRoutingModuleOptions {
  return config;
}

// packages/routing/src/core/utils/merge-config.util.ts
export function mergeConfig(
  options?: Partial<IRoutingModuleOptions>,
): IRoutingModuleOptions {
  const merged = { ...DEFAULT_ROUTING_CONFIG, ...options };
  // Normalise devSubdomains — dedupe + lowercase + drop empty strings.
  const devSubdomains = Array.from(
    new Set(
      (merged.devSubdomains ?? [])
        .map((s) => s.trim().toLowerCase())
        .filter(Boolean),
    ),
  );
  return { ...merged, devSubdomains };
}
```

Both `forRoot` and `forRootAsync` route through `mergeConfig` — v3.9.5.

**Note the collision:** `@stackra/ssr` already exports `defineConfig` (for the
Ssr root config) and `defineSsrConfig` alias. `@stackra/routing` will do the
same — root exports `defineConfig` (routing-scoped) and a compatibility alias
`defineRoutingConfig` at the top level for cross-package readability.

#### v3.9.4 — Remove `defineEvents` re-export

`§3 Public API` currently lists
`defineEvents(catalog) — re-exported from @stackra/analytics for typed analytics.`
**Remove.** Per `contract-reexports.md`, feature packages may not re-export from
other workspace packages. Consumers import `defineEvents` directly from
`@stackra/analytics`. Update the plan snippet in §3 (line 950) and any
`index.ts` sample.

#### v3.9.5 — `RoutingModule.forRoot` / `forRootAsync` / `forFeature` signatures

Every feature module in the workspace ships all three variants — routing must
too. Sketch:

```typescript
@Module({})
export class RoutingModule {
  static forRoot(options?: Partial<IRoutingModuleOptions>): DynamicModule {
    const config = mergeConfig(options);
    return {
      module: RoutingModule,
      global: true,
      imports: [
        MiddlewareModule.forRoot(),
        GuardModule.forRoot(),
        SeoModule.forRoot(),
      ],
      providers: [
        { provide: ROUTING_CONFIG, useValue: config },
        RouteRegistry,
        { provide: ROUTE_REGISTRY, useExisting: RouteRegistry },
        RouteMatcherService,
        { provide: ROUTE_MATCHER, useExisting: RouteMatcherService },
        ...(config.ai
          ? [
              AiRouteContextService,
              { provide: AI_ROUTE_CONTEXT, useExisting: AiRouteContextService },
            ]
          : []),
      ],
      exports: [
        ROUTING_CONFIG,
        ROUTE_REGISTRY,
        ROUTE_MATCHER,
        MiddlewareModule,
        GuardModule,
        SeoModule,
      ],
    };
  }

  static forRootAsync(
    options: IAsyncModuleOptions<IRoutingModuleOptions>,
  ): DynamicModule {
    return {
      module: RoutingModule,
      global: true,
      imports: [
        ...(options.imports ?? []),
        MiddlewareModule.forRoot(),
        GuardModule.forRoot(),
        SeoModule.forRoot(),
      ],
      providers: [
        {
          provide: ROUTING_CONFIG,
          useFactory: async (...args: unknown[]) =>
            mergeConfig(await options.useFactory(...args)),
          inject: options.inject ?? [],
        },
        // Same providers as forRoot; conditional AI wire uses ROUTING_CONFIG.
      ],
      exports: [
        ROUTING_CONFIG,
        ROUTE_REGISTRY,
        ROUTE_MATCHER,
        MiddlewareModule,
        GuardModule,
        SeoModule,
      ],
    };
  }

  /**
   * Contribute additional routes from a feature module. Uses the shared
   * `createSeedLoader` from `@stackra/support` — never a return-`true`
   * side-effect factory.
   */
  static forFeature(input: IRoutingFeatureOptions): DynamicModule {
    return {
      module: RoutingModule,
      providers: [
        {
          provide: seedLoaderToken(`routing-feature:${input.name}`),
          useFactory: (registry: RouteRegistry) =>
            createSeedLoader(() => {
              for (const route of input.routes)
                registry.register(route, "feature");
            }),
          inject: [RouteRegistry],
        },
      ],
    };
  }
}
```

Every DI-consumed service (`RouteRegistry`, `RouteMatcherService`,
`AiRouteContextService`) implements `OnModuleInit` when it seeds state; every
discovery service (`MiddlewareDiscovery`, `GuardLoader`) implements
`OnApplicationBootstrap`. Explicit `module-lifecycle.md` conformance.

#### v3.9.6 — Contracts stays zero-dep. `IRrv*` re-exports move to `@stackra/routing/rrv7`.

Adding `react-router` as any kind of dep on `@stackra/contracts` is off the
table — the package has been zero-dep since 0.1.0 and every other framework
package leans on that discipline.

**Corrected placement:**

```
packages/routing/src/rrv7/                # NEW — RRv7 type re-exports live here
├── index.ts
└── (empty otherwise)

packages/routing/package.json — exports:
  ".": ...,
  "./react": ...,
  "./vite": ...,
  "./matchers": ...,
  "./seo": ...,
  "./testing": ...,
  "./rrv7": {"types": "./dist/rrv7.d.ts", ...}    # NEW subpath
```

```typescript
// packages/routing/src/rrv7/index.ts — the re-export file
export type {
  RouteObject as IRrvRouteObject,
  LoaderFunctionArgs as IRrvLoaderArgs,
  ActionFunctionArgs as IRrvActionArgs,
  Location as IRrvLocation,
  Params as IRrvParams,
  ShouldRevalidateFunctionArgs as IRrvShouldRevalidateArgs,
  MetaFunction as IRrvMetaFunction,
} from "react-router";
```

`@stackra/contracts/src/interfaces/routing/` still exists but contains **only
Stackra-owned** interfaces (`IRouteRecord`, `IRouterConfig`,
`IRoutingModuleOptions`, `IPageConfig`, `IPageContext`, `IPrerenderContext`,
`ICanActivate`, `IMiddleware`, `IGuardContext`, `IGuardDecision`,
`IMatcherContext`, `ISubdomainPredicate`, ...). Any Stackra type that needs to
reference an RRv7 type re-imports it as `import type` from `react-router` in its
own declaration file — `react-router` becomes a **type-only devDependency** of
`@stackra/contracts` for the tsc build.

**Contracts `package.json` diff:**

```jsonc
{
  "devDependencies": {
    "react-router": "catalog:react-router", // NEW — types only, no runtime dep
    // ...existing
  },
}
```

The contracts build produces `.d.ts` files that reference `react-router` types.
Consumers of `@stackra/contracts` who care about routing types must have
`react-router` installed themselves — which every `@stackra/routing` consumer
already does via routing's peer.

#### v3.9.7 — `@stackra/actions` is a HARD peer of `@stackra/routing`

Early-development trade-off: simplicity wins. Every routing consumer installs
`@stackra/actions`. No fallback path, no degraded mode, no optional-peer sugar.

**Routing `package.json` peerDependencies:**

```jsonc
{
  "peerDependencies": {
    "@stackra/actions": "workspace:^",
    "@stackra/analytics": "workspace:^",
    "@stackra/container": "workspace:^",
    "@stackra/contracts": "workspace:^",
    "@stackra/decorators": "workspace:^",
    "@stackra/error": "workspace:^",
    "@stackra/events": "workspace:^",
    "@stackra/logger": "workspace:^",
    "@stackra/pipeline": "workspace:^",
    "@stackra/support": "workspace:^",
    "@stackra/testing": "workspace:^",
    "@stackra/ui": "workspace:^",
    "react": "*",
    "react-dom": "*",
    "react-router": "*",
    "reflect-metadata": "*",
    "@stackra/ai": "workspace:^",
    "@stackra/csp": "workspace:^",
    "@stackra/state": "workspace:^",
    "@stackra/query": "workspace:^",
    "@stackra/devtools": "workspace:^",
  },
  "peerDependenciesMeta": {
    "@stackra/testing": { "optional": true },
    "@stackra/ai": { "optional": true },
    "@stackra/csp": { "optional": true },
    "@stackra/state": { "optional": true },
    "@stackra/query": { "optional": true },
    "@stackra/devtools": { "optional": true },
  },
}
```

**Hard peers** (routing crashes without them): actions, analytics, container,
contracts, decorators, error, events, logger, pipeline, support, ui, react,
react-dom, react-router, reflect-metadata.

**Optional peers** (feature-flagged): ai, csp, state, query, devtools, testing.

#### v3.9.8 — NO deprecations. Cold delete of old names.

Development phase, no consumers. Every renamed / removed symbol is dropped
outright. No `@deprecated` shim, no aliased re-export for a grace release, no
migration warnings.

Applies to:

- `<StackraRouter>` — dropped. Replaced by `<StackraRoutingProvider>` (v3.10.1).
- `@Route` decorator — dropped. Replaced by `definePage()` module colocation
  (v3.1).
- `@ApiRoute` decorator + `ApiRouteRegistry` + `matchApiRoute` — dropped cold;
  no successor (v3.10.3).
- `attachMiddleware` public helper — dropped from the public API; moved to an
  internal utility used by `<StackraRoutingProvider>` (v3.10.2).
- Guard `group` field on `@Guard` options — dropped (already in v3.7).
- `SsrModule` composite export — dropped when the whole `@stackra/ssr` package
  is deleted (migration step 8 in §26).
- Everything else `@stackra/ssr` exports that isn't part of the routing/seo new
  home — dropped.

### v3.10 — FEATURE PARITY (post-review port items)

Confirmed real features in `packages/ssr/src/core/index.ts` that need decisions.

#### v3.10.1 — Port `<StackraRouter>` as `<StackraRoutingProvider>`

The current `<StackraRouter>` wraps three concerns:

1. Resolve the DI container (defaults to global via
   `getGlobalApplicationContext()`).
2. Read the route tree from `ROUTE_REGISTRY` (defaults) or accept an explicit
   prop.
3. Wire `attachMiddleware` and construct a browser/memory router, then render
   `<RouterProvider>`.

Port as `<StackraRoutingProvider>` in `@stackra/routing/react`. Same three
concerns, minus the `attachMiddleware` public exposure (moved internal per
v3.10.2). Renamed to shed `ssr` baggage.

```typescript
// @stackra/routing/react — the app-level convenience wrapper
export interface IStackraRoutingProviderProps {
  readonly app?: IApplication;
  readonly routes?: readonly IRouteRecord[];
  readonly kind?: "browser" | "memory" | "hash";
  readonly opts?: DOMRouterOpts | MemoryRouterOpts;
  readonly fallback?: ReactNode;
}

export function StackraRoutingProvider(
  props: IStackraRoutingProviderProps,
): ReactElement;
```

**Fallback in the base `main.tsx`** — the app writes one line:

```tsx
// apps/dashboard/src/main.tsx
createRoot(el).render(
  <ContainerProvider context={app}>
    <StackraRoutingProvider />
  </ContainerProvider>,
);
```

Explicit route tree / memory router shape stays available for tests + SSR
fallback (dead flag today; kept for symmetry).

#### v3.10.2 — `attachMiddleware` — port as internal utility

Public surface: gone (v3.9.8). Internal use only, called from
`<StackraRoutingProvider>` after the container + routes resolve. Same signature
as today (`(routes, app, env: 'client' | 'server') => wired`), but lives at
`packages/routing/src/react/utils/attach-middleware.util.ts` and is NOT
re-exported.

Rationale: consumers should never touch it directly — the flow is always "call
`<StackraRoutingProvider>`". Keeping it internal shrinks the public API surface
(fewer footguns, fewer breaking-change vectors).

#### v3.10.3 — `@ApiRoute` / `ApiRouteRegistry` / `matchApiRoute` — DROPPED (SPA-only)

Confirmed real in `packages/ssr/src/core/index.ts`. **Dropped by design.**

Rationale:

- SPA + Laravel-backed architecture. API routes go to the Laravel backend, not
  to a JS-defined route.
- Dev-time mock APIs (MSW, JSON server) don't need decorator wiring — the app
  configures them in the Vite dev server or MSW handler directly.
- No consumer today uses `@ApiRoute` on `apps/dashboard`, `apps/landing-page`,
  or any `packages/*` — confirmed via grep. Safe to delete.

**Explicit call-out in §26 migration:** the `apps/dashboard` migration must NOT
reintroduce `@ApiRoute`; if a dev-time mock is needed, use MSW.

#### v3.10.4 — Devtools contribution — port + rename

`SsrDevtoolsPanel` + `SsrInspectorSource` in `packages/ssr/src/react/devtools/`
port to `packages/routing/src/react/devtools/` as `RoutingDevtoolsPanel` +
`RoutingInspectorSource`. Same shape, same decorators from
`@stackra/decorators/devtools`.

**`RoutingDevtoolsPanel` surfaces:**

- Route tree — the `IRouteRecord` tree from `ROUTE_REGISTRY`, hydration status.
- Active match chain — from `useMatches()`, one row per matched route.
- Middleware chain per route — resolved middleware in execution order.
- Guards fired — most recent 20, with allow/deny + reason.
- Active matchers — subdomain / query / header / hash resolutions.

**`RoutingInspectorSource` surfaces:**

- One region per hydration boundary (`[data-hydrated]`,
  `[data-routing-boundary]`).
- Overlay tooltip includes the matched route path + mode + guards fired.

**Wiring** — automatic when `@stackra/devtools` is installed:

```typescript
// routing.module.ts (excerpt)
static forRoot(options?): DynamicModule {
  const config = mergeConfig(options);
  // ...
  imports: [
    // Conditional — only wires when @stackra/devtools is installed AND
    // the caller opts in. The `DevtoolsModule.forFeature(...)` no-ops when
    // the package is absent, so the import stays safe.
    ...(config.devtools !== false
      ? [DevtoolsModule.forFeature([RoutingDevtoolsPanel, RoutingInspectorSource])]
      : []),
  ],
}
```

Devtools stays an **optional peer** (v3.9.7). No wire when absent, zero runtime
cost.

### v3.11 — PHASE-1 ADDITIONS

All must-haves the reviewer flagged, spec'd here.

#### v3.11.1 — `defineLayout()` sibling to `definePage()`

Layout-only routes (no data) get their own helper. Cleaner than a `definePage()`
with every field optional.

```typescript
// apps/dashboard/src/layouts/authenticated.layout.tsx
import {defineLayout} from '@stackra/routing';

export default function AuthenticatedLayout() {
  return (
    <div className="flex">
      <Sidebar />
      <main><Outlet /></main>
    </div>
  );
}

export const layout = defineLayout({
  guards: [AuthGuard],
  middleware: ['@authenticated'],
  seo: {robots: 'noindex'},                      // static
  ErrorComponent: AuthenticatedError,
  LoadingComponent: AuthenticatedSkeleton,
});
```

Type shape:

```typescript
export interface ILayoutConfig {
  readonly guards?: readonly IGuardRef[];
  readonly middleware?: readonly IMiddlewareRef[];
  readonly seo?: ISeoDescriptor | ((ctx: ILayoutContext) => ISeoDescriptor);
  readonly breadcrumb?: string | ((ctx: ILayoutContext) => string);
  readonly ErrorComponent?: ComponentType<IErrorProps>;
  readonly LoadingComponent?: ComponentType;
  readonly PendingComponent?: ComponentType;
  readonly NotFoundComponent?: ComponentType;
  readonly history?: IRouteHistory;
  readonly access?: {
    roles?: readonly string[];
    permissions?: readonly string[];
  };
  readonly head?: readonly ILinkTag[]; // v3.11.4
  readonly announce?: string | ((ctx: ILayoutContext) => string) | false; // v3.11.6
}

export function defineLayout(config: ILayoutConfig): ILayoutConfig;
```

**Difference vs `definePage()`:** no `load`, no `prerender`, no `analytics`, no
`mode` / `overlay`, no `isEmpty` / `EmptyComponent`. Layouts don't own data or
route modes — they wrap children in a shell.

Module colocation: `export const layout = defineLayout({...})` — mirrors the
`export const page = definePage({...})` shape from v3.1. Framework adapter
detects `layout` vs `page` at load time.

#### v3.11.2 — `revalidate` on `definePage()` (with optional `@stackra/state` integration)

Wire RRv7's `shouldRevalidate` through `definePage`.

```typescript
export const page = definePage<IUser>({
  load: async ({ params }) => fetchUser(params.id),
  revalidate: ({ currentUrl, nextUrl, defaultShouldRevalidate }) => {
    // Only refetch when navigating to a different user — same-user
    // subpath transitions don't trigger a reload.
    return nextUrl.pathname === currentUrl.pathname
      ? false
      : defaultShouldRevalidate;
  },
});
```

Full signature (mirrors RRv7's `ShouldRevalidateFunctionArgs` + framework
context):

```typescript
export interface IRevalidateContext<TData> {
  readonly currentUrl: URL;
  readonly nextUrl: URL;
  readonly currentParams: Readonly<Record<string, string>>;
  readonly nextParams: Readonly<Record<string, string>>;
  readonly formAction?: string;
  readonly formMethod?: string;
  readonly defaultShouldRevalidate: boolean;
  readonly actionResult?: unknown;
}

// In IPageConfig<TData, TParams>:
readonly revalidate?: (ctx: IRevalidateContext<TData>) => boolean;
```

**Optional `@stackra/state` integration:**

Routes may declare a store dependency so their loader auto-revalidates on store
mutations:

```typescript
export const page = definePage<IUser>({
  load: async ({ params }) => fetchUser(params.id),
  invalidateOn: [USER_STORE], // any mutation to USER_STORE triggers revalidate
});
```

When `@stackra/state` is installed AND `invalidateOn` is set, the framework
subscribes to the listed stores at mount and calls `revalidator.revalidate()` on
any mutation. Off by default — nothing wires when `@stackra/state` is absent.

#### v3.11.3 — `<Link prefetch>` modes

Ship four modes:

```typescript
export interface ILinkProps {
  readonly to: string;
  readonly prefetch?: "hover" | "intent" | "render" | "off";
  readonly replace?: boolean;
  // ...standard <a> props
}
```

Semantics:

- **`'hover'`** (default) — start fetching the route's `load()` on mouse enter /
  focus. If the user clicks, the fetch is already in flight.
- **`'intent'`** — start fetching on user intent — mouse press-down, key down,
  or touchstart. Faster than 'hover' but with more false positives.
- **`'render'`** — start fetching on link mount. Aggressive; only for
  above-the-fold nav where every link WILL likely be clicked.
- **`'off'`** — never prefetch. For links that navigate away from the app or to
  routes with expensive loaders.

Framework caches prefetched results via RRv7's own loader cache; a
follow-through navigation reuses the cached result.

#### v3.11.4 — Route-level `head` — extra `<link>` tags

Beyond SEO's canonical / OG tags, routes often need preloads, prefetches,
DNS-prefetch, or alternate stylesheets. Ship a first-class `head` field:

```typescript
export const page = definePage({
  head: [
    {
      rel: "preload",
      href: "/fonts/inter.woff2",
      as: "font",
      crossOrigin: "anonymous",
    },
    { rel: "preconnect", href: "https://api.stripe.com" },
    { rel: "alternate", hreflang: "fr", href: "https://example.com/fr/" },
  ],
});

// Framework adapter appends these to RRv7's `links` export under the hood.
export interface ILinkTag {
  readonly rel: string;
  readonly href: string;
  readonly as?: "font" | "style" | "script" | "image" | "fetch";
  readonly type?: string;
  readonly crossOrigin?: "anonymous" | "use-credentials";
  readonly hreflang?: string;
  readonly media?: string;
  readonly integrity?: string;
}
```

`head` accepts a value OR function returning the array (same "value OR function"
pattern as `seo`, `breadcrumb`, `analytics`).

#### v3.11.5 — Testing helpers

Ship in `@stackra/routing/testing`:

```typescript
// Programmatic test router — no jsdom, no real DOM.
export function createTestRouter(
  routes: readonly IRouteRecord[],
  opts?: {
    initialEntries?: readonly string[];
    initialIndex?: number;
    container?: IApplication;
  },
): ITestRouter;

// Mock navigate — records every dispatched NavigateAction for later assertion.
export function mockNavigate(): {
  fn: (to: string, opts?: INavigateOptions) => Promise<void>;
  calls: readonly INavigateCall[];
  reset: () => void;
};

// Assertions on the current router state.
export function expectRoute(router: ITestRouter, pathPattern: string): void;
export function expectMatched(router: ITestRouter, routeName: string): void;
export function expectGuardBlocked(
  router: ITestRouter,
  guardName: string,
): void;
```

Usage:

```typescript
// __tests__/user-page.spec.tsx
import {
  createTestRouter,
  expectRoute,
  mockNavigate,
} from "@stackra/routing/testing";

test("unauthenticated user redirected to /login", async () => {
  const router = createTestRouter(routes, { initialEntries: ["/dashboard"] });
  await router.waitForIdle();
  expectRoute(router, "/login");
});
```

#### v3.11.6 — A11y announcer per-route

Route transitions should announce themselves to screen readers. Per-route
override:

```typescript
export const page = definePage<IBlogPost>({
  announce: ({ data }) => `Blog post: ${data.title}`, // dynamic
});

// Or static:
export const page = definePage({
  announce: "Home page loaded",
});

// Or explicit opt-out:
export const page = definePage({
  announce: false, // silent — for dialog-mode routes or minor transitions
});
```

Framework's built-in `<A11yAnnouncer />` (mounted by `<StackraRoutingProvider>`)
reads the resolved announcement on every route change and writes to a
`role="status" aria-live="polite"` region.

**Default** when `announce` is omitted:

- Extracted from the resolved `seo.title` — same content the browser tab shows.
- Falls back to `breadcrumb` value when `seo.title` is empty.
- Falls back to the pathname when both are empty.

#### v3.11.7 — `useRouteQueryState<T>()` — query-param↔state binding

Bidirectional binding between a query-param and React state. Built on
`@stackra/query`'s `useQuery` when installed, falls back to plain URL
`searchParams` when absent.

```typescript
// @stackra/routing/react
export function useRouteQueryState<T>(
  key: string,
  defaultValue: T,
  options?: IRouteQueryStateOptions<T>,
): readonly [T, (next: T) => void];

export interface IRouteQueryStateOptions<T> {
  /** Serialiser — how T becomes a string in the URL. */
  readonly serialize?: (value: T) => string;
  /** Deserialiser — how the URL string becomes T. */
  readonly deserialize?: (raw: string) => T;
  /** Replace mode: mutating pushes vs replaces history. Default: 'replace'. */
  readonly mode?: "push" | "replace";
  /** Debounce writes to the URL by N ms. Default: 0. */
  readonly debounceMs?: number;
}
```

Usage:

```tsx
function UserList() {
  const [tab, setTab] = useRouteQueryState("tab", "overview" as const);
  const [page, setPage] = useRouteQueryState("page", 1, {
    serialize: String,
    deserialize: (raw) => parseInt(raw, 10) || 1,
    mode: "push",
  });

  return (
    <>
      <Tabs value={tab} onValueChange={setTab}>
        ...
      </Tabs>
      <Pagination page={page} onChange={setPage} />
    </>
  );
}
```

**Integration with `@stackra/query`:** when installed, `useRouteQueryState` uses
the query client's cache to dedupe reads on the same param across components.
Off by default — plain URL binding is always available.

#### v3.11.8 — `@stackra/cli` — new package for the `stackra` binary

`pnpm stackra dev-hosts` needs a home. Ship a dedicated CLI package:

```
packages/cli/
├── package.json                    # "bin": {"stackra": "./dist/bin/stackra.js"}
├── tsup.config.ts                  # emits bin/stackra + core commands
├── src/
│   ├── core/
│   │   ├── index.ts
│   │   ├── cli.module.ts           # DI module for cross-command shared services
│   │   ├── constants/
│   │   ├── interfaces/
│   │   ├── services/               # ConfigLoaderService, FileWriterService, etc.
│   │   └── utils/
│   ├── commands/                   # one folder per command
│   │   ├── dev-hosts/
│   │   │   ├── dev-hosts.command.ts
│   │   │   ├── dev-hosts-add.util.ts
│   │   │   └── dev-hosts-remove.util.ts
│   │   └── (future: build, doctor, migrate, ...)
│   └── bin/
│       └── stackra.ts              # entry — parses argv, dispatches to command
└── vitest.config.ts
```

**Commands as decorators (mirrors NestJS Commander):**

```typescript
// packages/cli/src/commands/dev-hosts/dev-hosts.command.ts
@Command({
  name: "dev-hosts",
  description: "Add / remove /etc/hosts entries for local subdomain testing.",
  options: [
    { flag: "--remove", description: "Remove entries instead of adding." },
    {
      flag: "--rootDomain <domain>",
      description: "Override rootDomain from config.",
    },
  ],
})
export class DevHostsCommand implements ICommand<{
  remove?: boolean;
  rootDomain?: string;
}> {
  public constructor(
    @Inject(ROUTING_CONFIG_LOADER)
    private readonly loader: IRoutingConfigLoader,
  ) {}

  public async run(options: {
    remove?: boolean;
    rootDomain?: string;
  }): Promise<void> {
    // Read routing config, resolve rootDomain, apply /etc/hosts change with sudo.
  }
}
```

**Peers:** the CLI depends on `@stackra/container`, `@stackra/contracts`,
`@stackra/support`, `@stackra/decorators` — but the ROUTING config is loaded
from the target app's filesystem, not linked at compile time.

**Installation** — every workspace app already has `@stackra/cli` in
devDependencies (installed by the migration step 5); running
`pnpm stackra <command>` in an app directory dispatches to the right command.

Future commands (deferred, not blocking): `stackra build`, `stackra doctor`,
`stackra migrate`, `stackra generate`.

### v3.12 — EDGE CASE RULES

Explicit rules for every case the plan glossed. Non-negotiable — spec'd here
once so the implementation doesn't drift.

#### v3.12.1 — Overlapping route matches

**Rule:** first-declared-wins within a specificity tier. Specificity is:

1. More match constraints > fewer (a route with `match.subdomain` beats a route
   without one).
2. Longer path segments > shorter (`/users/:id` beats `/*`).
3. Same specificity → declaration order in `routes.ts` wins.

Framework `RouteMatcher` service normalises routes at registration time and
throws a named error at bootstrap when two routes tie exactly on specificity +
declaration site (unreachable ambiguity).

#### v3.12.2 — Guard throws (not returns `false`)

**Rule:** thrown errors from `canActivate()` propagate to the nearest
`ErrorComponent` slot up the match chain (per the standard nearest-neighbor
fallback rule from §6). The router treats a thrown error the same as a loader
throw — never a silent block. Guards that intend to block should `return false`
OR return an `IGuardDecision` with `allow: false`.

#### v3.12.3 — `useNavigate()` outside a router

**Rule:** throws immediately with a clear message:

```
useNavigate() called outside <StackraRoutingProvider>. Mount your React tree under
<ContainerProvider> and <StackraRoutingProvider> before using routing hooks.
```

No silent noop. The message names the two providers so remediation is one `grep`
away.

#### v3.12.4 — 404 in dialog / drawer / sheet mode

**Rule:** the overlay closes and the framework navigates to
`overlay.fallbackRoute` (which defaults to the current match chain's parent).
Behavior is uniform across `mode: 'dialog' | 'drawer' | 'sheet'` — users never
see a broken overlay stuck open on a missing resource.

**Config knob:**

```typescript
mode: 'dialog',
overlay: {
  size: 'md',
  onDismiss: 'to-parent',
  fallbackRoute: '/users',   // where 404 lands
  onError: 'close' | 'stay',  // NEW — 'close' (default) OR 'stay' (renders NotFoundComponent inside the overlay)
},
```

#### v3.12.5 — CSP nonce during prerender

**Rule:** emit a placeholder token `__STACKRA_NONCE__` in the prerendered HTML.
Runtime (Vite/Express/edge worker) replaces on request-serve with the
per-request nonce. `<Scripts nonce={useNonce()}>` at render time re-uses the
runtime nonce — no double-write.

Documentation call-out: this needs the app's edge/serve layer to know about the
placeholder. Ship a lightweight `stackraNonceMiddleware()` for Express

- Vite dev server; document the format for Cloudflare Workers / Lambda@Edge.

#### v3.12.6 — Circular middleware groups

**Rule:** resolver throws `MIDDLEWARE_CYCLE_DETECTED` at registration time (not
at request time). Named error, actionable message:

```
Middleware group '@authenticated' has a circular reference:
  @authenticated → @internal → @authenticated

Break the cycle by inlining one group into a plain middleware list.
```

Resolver runs a DFS at bootstrap; every group's transitive membership is
computed once and cached.

#### v3.12.7 — Build-time DI container safety

**Rule:** modules that touch browser APIs (`window`, `document`, IndexedDB,
BroadcastChannel, WebSocket, `localStorage`, `sessionStorage`) MUST guard
against the build-time platform:

```typescript
// Well-known env var set by the prerender pipeline:
if (Env.get("STACKRA_PLATFORM") === "build") {
  // Register a no-op / mock version for prerender.
  return {
    module: MyModule,
    providers: [{ provide: MY_SERVICE, useValue: nullMock }],
  };
}
// Normal path — browser is available.
```

Framework exports `isBuildTime()` helper in `@stackra/support` so guard lines
read consistently across modules:

```typescript
import {isBuildTime} from '@stackra/support';
if (isBuildTime()) { ... }
```

Add this to `@stackra/support`'s `Env` façade.

#### v3.12.8 — `<ScrollRestoration />` interaction

**Rule:** do NOT mount `<ScrollRestoration />` when using `history.keepScroll` /
`history.scrollKey` — framework's internal scroll manager supersedes it.
`<StackraRoutingProvider>` mounts the correct manager based on config. Consumers
should never mount either directly.

Documented explicitly in the migration guide + on the `history` field's JSDoc.

#### v3.12.9 — Hydration mismatch on dynamic SEO

**Rule:** `<SeoHead />` deduplicates by content-hash on the render side —
re-rendering with different fields is safe. React itself handles the `<head>`
update as a normal reconciliation. No special SSR hydration path needed since we
prerender without runtime SSR.

**Note for `useLoaderData()` typing:** framework ships `useRouteData<TData>()`
typed against `page`'s generic:

```typescript
export function useRouteData<TData>(): TData;

// Consumer:
const data = useRouteData<IBlogPost>();
```

Cleaner than RRv7's raw `useLoaderData<typeof loader>()` because the type
argument is the SAME `TData` used in `definePage<TData>`.

### v3.13 — INDEX FIXES

Housekeeping — inconsistencies in the earlier v2 sections that must be
reconciled against v3.

#### v3.13.1 — `./matchers` in the exports map

The subpath is used throughout v3.6 (`@stackra/routing/matchers`) but the plan's
earlier §2 exports listing omits it. Add:

```jsonc
{
  "exports": {
    ".": {...},
    "./react": {...},
    "./vite": {...},
    "./matchers": {"types": "./dist/matchers.d.ts", "import": "./dist/matchers.mjs", "require": "./dist/matchers.js"},
    "./seo": {...},
    "./testing": {...},
    "./rrv7": {...}    // v3.9.6
  }
}
```

And add `matchers: 'src/core/matchers/index.ts'` + `rrv7: 'src/rrv7/index.ts'`
to `tsup.config.ts`.

#### v3.13.2 — `defineEvents` re-export removed from §3

Per v3.9.4, edit the "Public API" section 3 sample (line 950) to REMOVE the
`defineEvents` re-export. Consumers import from `@stackra/analytics` directly.

#### v3.13.3 — `@Guard` samples updated for v3.7

The `@Guard({name: 'auth', group: '@authenticated'})` example on line 1669
carries the removed `group` field. Update to
`@Guard({name: 'auth', priority: 1000})` and bundle via the middleware group
definition in the surrounding example.

Same fix for the "Globals and groups" section (§9, line 1089) — remove the
"`group` options on `IGuardOptions`" mention. `group` lives on
`IMiddlewareOptions` only.

#### v3.13.4 — `matchers/builders/` folder added to §2 tree

The four builder objects (`subdomain`, `query`, `header`, `hash`) need a home.
Add to the tree:

```
packages/routing/src/core/matchers/
├── services/
│   ├── route-matcher.service.ts
│   └── ...
├── builders/                     # NEW
│   ├── subdomain.builder.ts      # one file per builder
│   ├── query.builder.ts
│   ├── header.builder.ts
│   ├── hash.builder.ts
│   └── index.ts
├── interfaces/
└── index.ts                       # re-exports builders + services
```

Each builder is `export const subdomain: ISubdomainMatchers = {...}` — one
export per file per `code-standards.md`. Barrel re-exports them.

#### v3.13.5 — `not(...)` on every matcher builder

Per the review, only `subdomain` was documented with `.not(...)`. Ensure
`query`, `header`, `hash` builders all have identical shape:

```typescript
export interface IQueryMatchers {
  // ...existing
  not(pred: IQueryPredicate | string): IQueryPredicate;
}
// Same for IHeaderMatchers, IHashMatchers.
```

Consistent shape across the four builders, one thing to learn.

#### v3.13.6 — Verification checklist additions

Add to the plan's Verification section:

- `packages/cli` builds green.
- `pnpm stackra dev-hosts --dry-run` prints `/etc/hosts` diff without writing.
- `RoutingDevtoolsPanel` badge shows correct route count in the devtools UI.
- Prerender emits `dist/index.html` with a working `<title>` and JSON-LD.
- Prerender emits per-subdomain directories when any route uses
  `match.subdomain`.
- `useRouteQueryState()` round-trips through the URL correctly on
  push+pop+reload.
- `<Link prefetch="hover">` fires the loader on mouseenter.
- `<Link prefetch="off">` does NOT fire the loader on mouseenter.
- Guard-throws land on the nearest `ErrorComponent`.
- `useNavigate()` outside `<StackraRoutingProvider>` throws with the documented
  message.
- Dialog-mode 404 closes the overlay and lands on `fallbackRoute`.

---

---

## Table of contents

1. [Goals & non-goals](#goals--non-goals)
2. [Package layout](#package-layout)
3. [Public API](#public-api)
4. [Route type system — extending RRv7 through contracts](#route-type-system)
5. [Slots — loading / pending / error / not-found / empty](#slots)
6. [Framework-default fallbacks (HeroUI Pro + `@stackra/error`)](#framework-defaults)
7. [Middleware system](#middleware-system)
8. [Guard system](#guard-system)
9. [Global middleware + guards + groups](#globals-and-groups)
10. [Access shortcut — config field OR decorators](#access-shortcut)
11. [SEO system + JSON-LD](#seo-system)
12. [Analytics — typed event catalog](#analytics-typed)
13. [Breadcrumbs — `useBreadcrumbs()` / `useBreadcrumb()`](#breadcrumbs)
14. [Route modes — page / dialog / drawer / sheet](#route-modes)
15. [Advanced matchers — subdomain / query / header / custom](#advanced-matchers)
16. [Component-exported metadata (Next.js-style colocation)](#module-colocation)
17. [Prerender semantics](#prerender-semantics)
18. [Inheritance rules](#inheritance-rules)
19. [Aliased react-router surface](#aliased-surface)
20. [CSP integration](#csp-integration)
21. [`<SeoHead />` vs RRv7's `<Meta />` — naming rationale](#seohead-naming)
22. [`ssr: true` — what we're giving up, why the field is omitted](#ssr-true)
23. [Contracts additions](#contracts-additions)
24. [Decorators additions](#decorators-additions)
25. [Full usage in one snippet](#full-usage)
26. [Migration steps from `@stackra/ssr`](#migration-steps)
27. [Verification checklist](#verification)
28. [Open questions](#open-questions)

---

## Goals & non-goals

### Goals

- **SPA + SEO** via RRv7's native `prerender` for public routes.
- **One route file** as the source of truth (with optional Next.js-style
  colocated exports via `lazy`).
- **Full middleware + guard pipeline** with globals, groups, priorities, signals
  — Laravel-style pipeline + NestJS-style `ICanActivate` on top.
- **Type-safe SEO** with typed loader-data access in the descriptor closure.
- **Type-safe analytics** against a per-app event catalog.
- **Route modes** — page / dialog / drawer / sheet — first-class.
- **Advanced matchers** — subdomain / query / header — first-class.
- **CSP-safe** by default when `@stackra/csp` is wired.
- **Framework-shape consistency** — DI-first, decorators in
  `@stackra/decorators`, contracts in `@stackra/contracts`, mapped types in
  `@stackra/support`.

### Non-goals

- **Runtime SSR** (`ssr: true`). Consumers who want it drop to raw RRv7 config —
  not our supported path.
- **File-based routing.** Routes declared in code.
- **Backend-hosted `action`s / `headers` functions.** APIs go to the Laravel
  backend.

---

## Package layout

```
packages/routing/
├── src/
│   ├── core/
│   │   ├── define-route.util.ts
│   │   ├── define-router-config.util.ts
│   │   ├── define-middleware.util.ts
│   │   ├── define-guard.util.ts
│   │   ├── collect-prerender-paths.util.ts
│   │   ├── middleware/
│   │   │   ├── services/
│   │   │   │   ├── middleware-registry.service.ts
│   │   │   │   ├── middleware-resolver.service.ts
│   │   │   │   └── middleware-loader.service.ts
│   │   │   ├── signals/
│   │   │   ├── interfaces/
│   │   │   ├── errors/
│   │   │   └── middleware.module.ts
│   │   ├── guards/
│   │   │   ├── services/
│   │   │   │   ├── guard-registry.service.ts
│   │   │   │   ├── guard-adapter.service.ts       # guard → middleware bridge
│   │   │   │   └── guard-loader.service.ts        # discovery
│   │   │   ├── interfaces/
│   │   │   └── guard.module.ts
│   │   ├── seo/
│   │   │   ├── services/seo.service.ts
│   │   │   ├── utils/                             # organization, article, faqPage, …
│   │   │   ├── interfaces/
│   │   │   └── seo.module.ts
│   │   ├── analytics/                             # route-analytics service + hooks
│   │   │   ├── services/route-analytics.service.ts
│   │   │   └── analytics.module.ts
│   │   ├── matchers/                              # subdomain / query / header
│   │   │   ├── services/route-matcher.service.ts
│   │   │   └── interfaces/
│   │   ├── modes/                                 # page / dialog / drawer / sheet
│   │   │   ├── services/route-mode.service.ts
│   │   │   └── interfaces/
│   │   ├── routing.module.ts                     # composite DI module
│   │   └── index.ts
│   ├── react/
│   │   ├── to-rrv7-routes.util.ts                # runtime binding + slot wiring
│   │   ├── components/
│   │   │   ├── seo-head.component.tsx            # <SeoHead />
│   │   │   ├── links.component.tsx               # RRv7 <Links /> passthrough
│   │   │   ├── scripts.component.tsx             # <Scripts /> — csp-aware
│   │   │   ├── a11y-announcer.component.tsx      # <A11yAnnouncer />
│   │   │   ├── link.component.tsx                # <Link prefetch>
│   │   │   ├── overlay-outlet.component.tsx      # renders dialog/drawer/sheet routes
│   │   │   └── breadcrumbs.component.tsx         # <Breadcrumbs /> — optional renderer
│   │   ├── fallbacks/
│   │   │   ├── default-loading-fallback.component.tsx    # <Skeleton> grid
│   │   │   ├── default-pending-fallback.component.tsx    # top bar + <Spinner>
│   │   │   ├── default-empty-fallback.component.tsx      # <EmptyState> (Pro)
│   │   │   ├── default-not-found-fallback.component.tsx  # <EmptyState> "404"
│   │   │   ├── default-error-fallback.component.tsx      # re-export @stackra/error
│   │   │   └── index.ts
│   │   ├── hooks/
│   │   │   ├── use-breadcrumbs.hook.ts
│   │   │   ├── use-breadcrumb.hook.ts
│   │   │   ├── use-route-state.hook.ts
│   │   │   ├── use-route-analytics.hook.ts
│   │   │   ├── use-route-mode.hook.ts
│   │   │   └── use-current-match.hook.ts
│   │   ├── index.ts                              # RRv7 re-exports + our components
│   │   └── react-router.re-exports.ts            # createBrowserRouter, Outlet, useNavigate, …
│   ├── vite/                                     # build-time — Node context
│   │   ├── router-plugin.ts                      # `router()` — re-export of RRv7 plugin
│   │   └── index.ts
│   ├── config/                                   # build-time — Node context
│   │   ├── define-router-config.util.ts
│   │   └── index.ts
│   ├── testing/
│   │   ├── create-mock-context.util.ts
│   │   ├── run-middleware.util.ts
│   │   ├── run-guard.util.ts
│   │   ├── create-mock-matches.util.ts
│   │   └── index.ts
│   └── index.ts
├── package.json
├── tsconfig.json
├── tsup.config.ts
└── README.md
```

### Subpaths published

```jsonc
"exports": {
  ".":              "./src/index.ts",              // defineRoute, RoutingModule, defineMiddleware, defineGuard
  "./config":       "./src/config/index.ts",       // defineRouterConfig — Node build-time
  "./vite":         "./src/vite/index.ts",         // router() plugin
  "./react":        "./src/react/index.ts",        // <SeoHead>, <Link>, <RouterProvider>, hooks, fallbacks
  "./middleware":   "./src/core/middleware/index.ts",
  "./guards":       "./src/core/guards/index.ts",
  "./seo":          "./src/core/seo/index.ts",     // SeoService + JSON-LD builders
  "./analytics":    "./src/core/analytics/index.ts",
  "./testing":      "./src/testing/index.ts"
}
```

---

## Public API

- `defineRoute(def)` — single route atom.
- `defineRouterConfig({routes, basename?, appDirectory?})` —
  `react-router.config.ts` factory (hardcoded `ssr: false`).
- `defineMiddleware(fn | options | class)` — inline middleware.
- `defineGuard(fn | options | class)` — inline guard.
- `defineEvents(catalog)` — re-exported from `@stackra/analytics` for typed
  analytics.
- `toRRv7Routes(routes)` — client runtime binding.
- Components: `<SeoHead />`, `<Links />`, `<Scripts />` (csp-aware),
  `<A11yAnnouncer />`, `<Link>` (prefetch), `<Breadcrumbs />`,
  `<OverlayOutlet />`.
- Hooks: `useBreadcrumbs()`, `useBreadcrumb()`, `useRouteState()`,
  `useRouteMode()`, `useRouteAnalytics()`.
- Re-exports from `react-router`: `createBrowserRouter`, `createMemoryRouter`,
  `createHashRouter`, `RouterProvider`, `Outlet`, `Navigate`, `useNavigate`,
  `useLocation`, `useMatches`, `useMatch`, `useParams`, `useLoaderData`,
  `useNavigation`, `useSearchParams`, `useRouteError`, `isRouteErrorResponse`.

Consumers **never import from `react-router` directly** — everything flows
through `@stackra/routing/react`.

---

## Route type system

### RRv7 types → contracts

Copy RRv7's public type surface into
`@stackra/contracts/interfaces/routing/rrv7/` as re-exports so consumers depend
on contracts, not react-router:

```typescript
// packages/contracts/src/interfaces/routing/rrv7/index.ts
export type {
  RouteObject as IRrvRouteObject,
  DataRouteObject as IRrvDataRouteObject,
  LoaderFunctionArgs as IRrvLoaderArgs,
  ActionFunctionArgs as IRrvActionArgs,
  ShouldRevalidateFunctionArgs as IRrvShouldRevalidateArgs,
  Params as IRrvParams,
  Location as IRrvLocation,
  NavigateOptions as IRrvNavigateOptions,
  Match as IRrvMatch,
} from "react-router";
```

### Mapped types → support

Copy `.ref/mapped-types-master` (NestJS's `PartialType` / `PickType` /
`OmitType` / `IntersectionType`) into `packages/support/src/utils/mapped-types/`
as **TS-level utility types only** (drop the class-runtime bits; we only need
type inference).

### Our route record extends RRv7

```typescript
// packages/contracts/src/interfaces/routing/route.interface.ts
import type {
  IRrvRouteObject,
  IRrvLoaderArgs,
  IRrvShouldRevalidateArgs,
} from "./rrv7";

export interface IRouteRecord<
  TParams = Record<string, string>,
  TLoaderData = unknown,
> extends Omit<
  IRrvRouteObject,
  | "Component"
  | "element"
  | "errorElement"
  | "ErrorBoundary"
  | "HydrateFallback"
  | "loader"
  | "action"
  | "handle"
  | "children"
> {
  // ── Routing ───────────────────────────────────────────────────
  readonly path?: string;
  readonly index?: boolean;
  readonly caseSensitive?: boolean;
  readonly children?: readonly IRouteRecord[];

  // ── Rendering ─────────────────────────────────────────────────
  readonly Component?: React.ComponentType;
  readonly LoadingComponent?: React.ComponentType;
  readonly PendingComponent?: React.ComponentType;
  readonly ErrorComponent?: React.ComponentType<{ error: unknown }>;
  readonly NotFoundComponent?: React.ComponentType;
  readonly EmptyComponent?: React.ComponentType<{ loaderData: TLoaderData }>;
  readonly isEmpty?: (data: TLoaderData) => boolean;

  // ── Data ──────────────────────────────────────────────────────
  readonly loader?: (
    args: IRrvLoaderArgs<TParams>,
  ) => TLoaderData | Promise<TLoaderData>;
  readonly clientLoader?: (
    args: IRrvLoaderArgs<TParams>,
  ) => unknown | Promise<unknown>;
  readonly shouldRevalidate?: (args: IRrvShouldRevalidateArgs) => boolean;
  readonly action?: never; // banned when ssr:false

  // ── Colocated module ──────────────────────────────────────────
  readonly lazy?: () => Promise<IRouteModule<TParams, TLoaderData>>;

  // ── Gates & pipeline ──────────────────────────────────────────
  readonly guards?: readonly IGuardRef[];
  readonly middleware?: readonly IMiddlewareRef[];
  readonly access?: IAccessSpec;

  // ── SEO ───────────────────────────────────────────────────────
  readonly seo?:
    | ISeoDescriptor
    | ((ctx: ISeoContext<TParams, TLoaderData>) => ISeoDescriptor);

  // ── Prerender ─────────────────────────────────────────────────
  readonly prerender?: IPrerenderSpec<TParams>;

  // ── Extras ────────────────────────────────────────────────────
  readonly breadcrumb?:
    string | ((ctx: IBreadcrumbContext<TParams, TLoaderData>) => string);
  readonly analytics?: IRouteAnalytics;

  // ── Presentation mode ─────────────────────────────────────────
  readonly mode?: IRouteMode;
  readonly overlay?: IOverlayOptions;

  // ── Advanced matchers ─────────────────────────────────────────
  readonly match?: IRouteMatcher;
}
```

Zero drift when RRv7 upgrades — TS structural check catches breakage at build
time.

### Colocated module shape

```typescript
export interface IRouteModule<TParams, TLoaderData> {
  readonly default?: React.ComponentType;
  readonly Component?: React.ComponentType;
  readonly loader?: IRouteRecord<TParams, TLoaderData>["loader"];
  readonly clientLoader?: IRouteRecord<TParams, TLoaderData>["clientLoader"];
  readonly shouldRevalidate?: IRouteRecord<
    TParams,
    TLoaderData
  >["shouldRevalidate"];
  readonly prerender?: IPrerenderSpec<TParams>;
  readonly seo?: IRouteRecord<TParams, TLoaderData>["seo"];
  readonly breadcrumb?: IRouteRecord<TParams, TLoaderData>["breadcrumb"];
  readonly analytics?: IRouteAnalytics;
  readonly guards?: readonly IGuardRef[];
  readonly middleware?: readonly IMiddlewareRef[];
  readonly ErrorComponent?: React.ComponentType<{ error: unknown }>;
  readonly NotFoundComponent?: React.ComponentType;
  readonly LoadingComponent?: React.ComponentType;
  readonly PendingComponent?: React.ComponentType;
  readonly EmptyComponent?: React.ComponentType<{ loaderData: TLoaderData }>;
  readonly isEmpty?: IRouteRecord<TParams, TLoaderData>["isEmpty"];
}
```

Precedence: `defineRoute` field > lazy module export > inherited from parent >
framework default.

---

## Slots

Five per-route slots for the various render states. RRv7 has fragmented
primitives; we unify them.

| Slot                | Trigger                                                   | Mapped to RRv7                                             |
| ------------------- | --------------------------------------------------------- | ---------------------------------------------------------- |
| `LoadingComponent`  | Route loading data on first render / lazy Component fetch | `<Suspense fallback>` + `HydrateFallback`                  |
| `PendingComponent`  | Route transition in flight, previous route still visible  | `useNavigation().state === 'loading'` — rendered by layout |
| `ErrorComponent`    | Loader throws (non-signal), Component throws              | `errorElement`                                             |
| `NotFoundComponent` | `notFound()` signal thrown from guard/loader              | `errorElement` branch when `error.status === 404`          |
| `EmptyComponent`    | `isEmpty(data)` returns `true` on loader data             | Framework substitutes for `Component` after loader returns |

### Resolution chain — nearest-neighbor with framework default

For each slot at render time:

```
Route's own slot
  → parent match's slot
  → grandparent match's slot
  → …
  → root match's slot
  → framework default (HeroUI-based)
```

Never `null`. `useMatches()` gives us the walk direction. Framework defaults
live in `@stackra/routing/react/fallbacks/`.

---

## Framework defaults

Five slot fallbacks shipped by the package, built on HeroUI Pro / OSS +
`@stackra/error`.

| Fallback                  | Built on                                   | Behaviour                                            |
| ------------------------- | ------------------------------------------ | ---------------------------------------------------- |
| `DefaultLoadingFallback`  | `<Skeleton>` grid (OSS)                    | Shimmer skeleton at page scale                       |
| `DefaultPendingFallback`  | Fixed top progress bar + `<Spinner>` (OSS) | Non-blocking; previous UI stays interactive          |
| `DefaultEmptyFallback`    | `<EmptyState>` (Pro) with folder icon      | Title/description via props; default copy per-locale |
| `DefaultNotFoundFallback` | `<EmptyState>` (Pro) with 404 preset       | "Not found" copy, home-button action                 |
| `DefaultErrorFallback`    | Re-export from `@stackra/error/react`      | Existing card-based fallback with details toggle     |

Each accepts an `override` prop for consumer customization:

```typescript
<DefaultEmptyFallback
  title="No pricing tiers configured"
  description="Add a tier to see it here."
  action={{label: 'Add tier', onPress: openTierModal}}
/>
```

Consumers can also completely replace the framework defaults via
`RoutingModule.forRoot({fallbacks: {...}})`.

---

## Middleware system

Ported from `@stackra/ssr/middleware`. Full Laravel-style pipeline.

- **`@Middleware(options)`** — class decorator from
  `@stackra/decorators/routing`. Options: `name`, `priority`, `stage`
  (`'http' | 'ui' | 'pipe'`), `dependsOn`, `global` (new), `group` (new).
- **`defineMiddleware(fn | options | class)`** — inline typed factory.
- **`defineMiddlewareGroup({name: '@web', middleware: [...]})`** — named bundle.
- **Signals** — `redirect(url, status?)`, `notFound(message?)`,
  `abort(response)`.
- **Resolution order** — descending `priority`, ties by declaration order,
  `dependsOn` enforced as partial order.

Attached to routes: `middleware: ['@auth', 'audit']` (names) or
`middleware: [AuditMiddleware]` (class refs).

---

## Guard system

New layer on top of middleware. NestJS-style `ICanActivate` contract.

### Contract

```typescript
export interface ICanActivate {
  canActivate(
    context: IGuardContext,
  ): boolean | IGuardDecision | Promise<boolean | IGuardDecision>;
}

export interface IGuardContext<TState = Record<string, unknown>> {
  readonly request: Request;
  readonly url: URL;
  readonly params: Readonly<Record<string, string>>;
  readonly matches: readonly IMatchDescriptor[];
  readonly container: IApplication;
  state: TState;
}

export type IGuardDecision =
  | { readonly allow: true }
  | { readonly deny: true; readonly reason?: string; readonly status?: number }
  | { readonly redirect: string; readonly status?: number }
  | { readonly notFound: true; readonly message?: string }
  | { readonly abort: Response };
```

### Decorator

Lives in `@stackra/decorators/routing`, built via
`createDiscoverableClassDecorator`. Auto-applies `@Injectable()`.

### Guard → middleware bridge

`GuardAdapter` converts each guard registration into a middleware entry at guard
priority (default `1000`, above normal middleware). Guard decisions map to
signals.

### Registration

```typescript
defineRoute({
  path: "/dashboard",
  guards: [AuthGuard, RoleGuard("admin")], // DI class refs
});

defineRoute({
  path: "/admin",
  guards: ["auth", { name: "role", args: ["admin"] }], // name-based
});
```

---

## Globals and groups

**New**: `global` and `group` options on `IMiddlewareOptions` / `IGuardOptions`.

```typescript
@Middleware({name: 'audit', priority: 100, global: true, group: '@web'})
export class AuditMiddleware { … }

@Guard({name: 'auth', global: false, group: '@authenticated'})
export class AuthGuard implements ICanActivate { … }
```

Discovery loader:

1. Enumerates every `@Middleware` / `@Guard` in the container.
2. Reads metadata.
3. If `global: true` → registers in the global chain (equivalent to old
   `SsrModule.forRoot({globalMiddleware: ['name']})`).
4. If `group: '@web'` or `group: ['@web', '@public']` → registers as member of
   each named group.

Group definitions can be inline:

```typescript
export const authenticatedGroup = defineMiddlewareGroup({
  name: "@authenticated",
  middleware: ["session", "auth", "audit"], // resolved order applies
});
```

Consumers attach a group like any other middleware:
`middleware: ['@authenticated']`.

### Optional shortcut decorators

For pure ergonomics:

```typescript
@GlobalMiddleware({name: 'audit'})   // ≡ @Middleware({name: 'audit', global: true})
@GlobalGuard({name: 'anti-csrf'})    // ≡ @Guard({name: 'anti-csrf', global: true})
```

Ships in `@stackra/decorators/routing`.

---

## Access shortcut

Two equivalent forms — pick per taste.

### Config form (in `defineRoute`)

```typescript
defineRoute({
  path: "/admin/users",
  access: { roles: ["admin"], permissions: ["users.viewAll"] },
});
```

Sugar. Compiled to
`guards: [RoleGuard('admin'), PermissionGuard('users.viewAll')]` at
`toRRv7Routes` time.

### Component decorator form (colocated)

```typescript
@RequireRole('admin')
@RequirePermission('users.viewAll')
@RequireAny([{role: 'admin'}, {permission: 'users.override'}])
export class AdminUsersPage { … }
```

Decorators from `@stackra/decorators/routing`. Stamp metadata read by
`toRRv7Routes` when the Component is bound to a route; folded into the route's
`guards` list.

Both forms compose. If a route has `access: {...}` AND its Component has
`@RequireRole()`, both apply.

---

## SEO system

Ported from `@stackra/ssr/seo`. Full descriptor:

```typescript
export interface ISeoDescriptor {
  readonly title?: string;
  readonly titleTemplate?: string;
  readonly description?: string;
  readonly canonical?: string;
  readonly alternates?: readonly { href: string; hreflang: string }[];
  readonly robots?: IRobotsDirectives;
  readonly openGraph?: IOpenGraph;
  readonly twitter?: ITwitterCard;
  readonly jsonLd?: readonly Record<string, unknown>[];
  readonly meta?: readonly {
    name?: string;
    property?: string;
    content: string;
  }[];
}
```

JSON-LD builders (`organization`, `website`, `webPage`, `breadcrumbList`,
`article`, `product`, `faqPage`, `qaPage`, `speakable`) as pure functions from
`@stackra/routing/seo` — call site: `jsonLd: [article({…}), faqPage([…])]`.

`<SeoHead />` walks `useMatches()`, resolves each `handle.seo`, merges parent →
child (child scalars override; arrays append), renders `<title>`, `<meta>`,
`<link rel="canonical">`, alternates, robots, OG, Twitter, and JSON-LD scripts.

---

## Analytics — typed event catalog

### Contract

Add to `@stackra/contracts/interfaces/analytics/`:

```typescript
export interface IAnalyticsEventDefinition<
  TProps extends Record<string, unknown> = Record<string, unknown>,
> {
  readonly name: string;
  readonly properties?: TProps;
}

export type IAnalyticsEventCatalog = Readonly<
  Record<string, IAnalyticsEventDefinition>
>;
```

### Consumer flow

```typescript
// apps/dashboard/src/analytics.events.ts
import { defineEvents } from "@stackra/analytics";

export const events = defineEvents({
  view_pricing: { tier: "public" as const },
  sign_up: { method: "email" as "email" | "sso" },
  view_blog_post: { slug: "" as string, category: "" as string },
});

export type AppEvents = typeof events;
```

### Typed `analytics` field on routes

`defineRoute` is generic over the app's event catalog. `analytics.name` is
constrained to catalog keys; `analytics.properties` typed against that key's
shape.

```typescript
import type { AppEvents } from "./analytics.events";

defineRoute<AppEvents>({
  path: "/pricing",
  analytics: { name: "view_pricing", properties: { tier: "public" } }, // ✓
  // analytics: {name: 'wrong_event'}                                  // TS error
  // analytics: {name: 'sign_up', properties: {method: 'oauth'}}       // TS error
});
```

`useRouteAnalytics()` hook fires the event through `IAnalyticsManager` (from
`@stackra/analytics`) on every navigation.

---

## Breadcrumbs

Two hooks + one optional renderer.

```typescript
export interface IBreadcrumbEntry {
  readonly label: string;
  readonly path: string;
  readonly isCurrent: boolean;
  readonly params: Readonly<Record<string, string>>;
}

// The full trail — every match with a breadcrumb.
export function useBreadcrumbs(): readonly IBreadcrumbEntry[];

// Just the current (deepest) match.
export function useBreadcrumb(): IBreadcrumbEntry | null;
```

Internally: `useMatches()` → filter matches with `handle.breadcrumb` → resolve
function form with match's `loaderData` + `params` → build entries.

Optional renderer:

```tsx
import { Breadcrumbs } from "@stackra/routing/react";

<Breadcrumbs
  separator="/" // or ReactNode
  homeLabel="Home"
  homeIcon={<HomeIcon />}
/>;
```

Consumer can skip the renderer and consume `useBreadcrumbs()` directly inside a
HeroUI `<Breadcrumbs>` component.

---

## Route modes

**First-class overlay routes.** `mode: 'page' | 'dialog' | 'drawer' | 'sheet'`.

Non-page modes render as an overlay via HeroUI while the previous route stays
interactive underneath (parallel routes).

| Mode             | Built on                | Typical use                |
| ---------------- | ----------------------- | -------------------------- |
| `page` (default) | Full route render       | Standard navigation        |
| `dialog`         | HeroUI `<Modal>` (OSS)  | Confirmations, quick edits |
| `drawer`         | HeroUI `<Drawer>` (OSS) | Nav panels, filters        |
| `sheet`          | HeroUI Pro `<Sheet>`    | Detail panels, side quests |

### Overlay options

```typescript
export interface IOverlayOptions {
  readonly size?: "sm" | "md" | "lg" | "xl" | "full";
  readonly side?: "left" | "right" | "top" | "bottom"; // drawer/sheet only
  readonly dismissible?: boolean; // click-outside + ESC
  readonly onDismiss?: "back" | "route"; // history back vs navigate
  readonly fallbackRoute?: string; // used when onDismiss === 'route' or history empty
}

defineRoute({
  path: "/users/:id",
  mode: "sheet",
  overlay: {
    size: "md",
    side: "right",
    dismissible: true,
    onDismiss: "back",
    fallbackRoute: "/users",
  },
  Component: UserDetailSheet,
});
```

### Deep-linking behaviour

- Navigating to `/users/42` directly renders the parent route (`/users`)
  underneath + sheet on top. Framework infers the parent from route tree.
- Closing the sheet → history back (falls back to `fallbackRoute` when history
  is empty).
- No parent inferable → sheet renders on `<div id="app-shell" />` alone.

### Under the hood

`toRRv7Routes` treats overlay routes as parallel matches. `<OverlayOutlet />`
(placed once in root layout) renders the topmost overlay match. The underlying
`<Outlet />` in the parent layout renders the parent match.

---

## Advanced matchers

Advanced matchers run BEFORE RRv7's path matcher. A no-match falls through to
the next sibling.

```typescript
export interface IRouteMatcher {
  readonly subdomain?: string | RegExp | ReadonlyArray<string | RegExp>;
  readonly query?: Record<
    string,
    string | RegExp | ((value: string) => boolean)
  >;
  readonly header?: Record<string, string | RegExp>;
  readonly hash?: string | RegExp;
  readonly custom?: (context: IMatchContext) => boolean | Promise<boolean>;
}
```

### Examples

```typescript
// Subdomain — admin.example.com/*
defineRoute({
  path: "/*",
  match: { subdomain: "admin" },
  Component: AdminShell,
});

// Query variant — /edit?mode=advanced
defineRoute({
  path: "/edit",
  match: { query: { mode: "advanced" } },
  Component: AdvancedEditor,
});

// Multi-tenant — {tenant}.example.com
defineRoute({
  path: "/*",
  match: {
    subdomain: /^(?!www\.|admin\.)(.+)$/,
    custom: async (ctx) => Boolean(await lookupTenant(ctx.subdomain)),
  },
  Component: TenantShell,
});

// Preview mode — /post/:slug?preview=1
defineRoute({
  path: "/post/:slug",
  match: { query: { preview: "1" } },
  Component: DraftPostView,
});
```

### Prerender coupling

- **Subdomains at build time**: `collectPrerenderPaths` outputs files under
  per-subdomain directories. Deploy config maps subdomain → directory.
- **Query matchers**: only evaluated at runtime (SPA nav). Prerender ignores
  query-matched routes.
- **Custom async matchers**: runtime-only.

---

## Component-exported metadata

Optional — colocate route metadata with the page module (Next.js-style).

```typescript
// apps/dashboard/src/pages/blog-post.tsx
export default function BlogPostPage() { … }              // Component

export const loader = async ({params}) => fetchBlogPost(params.slug);

export const prerender = async () => {
  const slugs = await fetchBlogSlugsFromCms();
  return slugs.map((slug) => ({slug}));
};

export const seo = ({loaderData}) => ({
  title: loaderData.title,
  jsonLd: [article({headline: loaderData.title, …})],
});

export const breadcrumb = ({loaderData}) => loaderData.title;

export const guards = [AuthGuard];

export const middleware = ['@web'];
```

Route file:

```typescript
defineRoute({
  path: "blog/:slug",
  lazy: () => import("./pages/blog-post"),
});
```

Precedence: `defineRoute` field > lazy module export > inherited > framework
default.

---

## Prerender semantics

```typescript
export type IPrerenderSpec<TParams extends Record<string, string>> =
  | boolean
  | ReadonlyArray<TParams>
  | (() => ReadonlyArray<TParams> | Promise<ReadonlyArray<TParams>>);
```

| Route kind   | `prerender` value            | Effect                    |
| ------------ | ---------------------------- | ------------------------- |
| Static path  | `true`                       | Path added                |
| Static path  | `false` / omitted            | SPA fallback only         |
| Dynamic path | `[{slug: 'a'}, {slug: 'b'}]` | Two paths materialised    |
| Dynamic path | `async () => [...]`          | Function invoked at build |
| Dynamic path | `true`                       | **Build error**           |
| Any          | `false`                      | SPA fallback only         |

Nested params: `prerender: async () => [{category: 'a', id: '1'}, …]`.

Layout with prerendered parent + non-prerendered child → child renders SPA under
the pre-rendered shell.

---

## Inheritance rules

| Field                                                                                               | Inheritance                                                        |
| --------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| `middleware`                                                                                        | **Concatenated** parent → child                                    |
| `guards`                                                                                            | **Concatenated** parent → child                                    |
| `seo`                                                                                               | **Merged** at render; child scalars override parent, arrays append |
| `prerender`                                                                                         | **NOT inherited**                                                  |
| `ErrorComponent` / `NotFoundComponent` / `LoadingComponent` / `PendingComponent` / `EmptyComponent` | **Nearest ancestor with the slot wins**                            |
| `breadcrumb`                                                                                        | **NOT inherited** — each match contributes its own                 |
| `analytics`                                                                                         | **NOT inherited** — one event per match                            |
| `access`                                                                                            | **Concatenated** — parent AND child                                |
| `mode` / `overlay` / `match`                                                                        | **NOT inherited**                                                  |

---

## Aliased react-router surface

Consumers never import from `react-router` directly. Everything through
`@stackra/routing/*`:

| Consumer imports                                                                                                                                                                                                                                    | From                     |
| --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------ |
| `createBrowserRouter`, `RouterProvider`, `Outlet`, `Link`, `NavLink`, `useNavigate`, `useLocation`, `useMatches`, `useMatch`, `useParams`, `useLoaderData`, `useNavigation`, `useSearchParams`, `useRouteError`, `isRouteErrorResponse`, `Navigate` | `@stackra/routing/react` |
| `router()` (Vite plugin)                                                                                                                                                                                                                            | `@stackra/routing/vite`  |
| Config types (`IRrvRouteObject`, `IRrvLoaderArgs`, …)                                                                                                                                                                                               | `@stackra/contracts`     |
| `<SeoHead>`, `<Links>`, `<Scripts>`, `<A11yAnnouncer>`, `<Breadcrumbs>`, `<OverlayOutlet>`                                                                                                                                                          | `@stackra/routing/react` |

Rationale for `router()`: single-word, unambiguous alongside `defineConfig`,
doesn't lock us to `stackra` name (matches the "no stackra prefix in the public
API" preference).

---

## CSP integration

`<Scripts />` re-export from `@stackra/routing/react` is CSP-aware:

```typescript
export function Scripts(): ReactElement {
  const nonce = useNonce();   // from @stackra/csp/react — undefined when csp not wired
  return <RrvScripts nonce={nonce} />;
}
```

- `@stackra/csp` is an **optional peer** on `@stackra/routing`.
- Without csp wired: `useNonce()` returns `undefined`, RRv7's `<Scripts />`
  renders without nonce.
- With csp wired: `<NonceProvider>` at the root, RRv7 scripts get the
  per-request nonce, `<meta http-equiv="Content-Security-Policy">` is emitted by
  CSP's `<CspMeta />`.

For imperative script injection (analytics tags, third-party pixels), consumers
use `<Script>` from `@stackra/csp/react` — that component already handles nonce
injection into dynamically-created `<script>` elements.

---

## `<SeoHead />` naming rationale

Rejected: `<Meta />` (clashes with RRv7's built-in), `<Head />` (ambiguous),
`<SeoTags />` (says "many tags", awkward).

Picked `<SeoHead />` — reads as intent ("SEO head content"), composes naturally
with `<Links />` + `<Scripts />` from RRv7.

Convention: `<SeoHead />` goes inside the caller-owned `<head>`, does NOT render
the `<head>` element itself. Same as React Helmet / Next `<Head>` / RRv7
`<Meta>`.

---

## `ssr: true` — omitted from the config

Consequences of enabling SSR (which we're not):

- Requires a Node/Bun/Workers runtime alongside our Laravel backend.
- Duplicates data-fetch work (server loader → serialise → client hydrate) —
  wasteful for a data-heavy authenticated SPA.
- Latency: +1 hop per request for cookie auth against Laravel.
- Two middleware systems in one app (our + RRv7's own) — high friction.
- Server bundle to deploy (~2-3 MB).
- Cold-start costs on serverless.

Locked to `ssr: false`. The field is **omitted from the public
`defineRouterConfig` interface**. Consumers who want SSR drop to raw RRv7 config
— not our supported path.

---

## Contracts additions

### `packages/contracts/src/tokens/routing.tokens.ts`

```typescript
export const MIDDLEWARE_METADATA_KEY = "stackra:routing:middleware";
export const GUARD_METADATA_KEY = "stackra:routing:guard";
export const REQUIRE_ROLE_METADATA_KEY = "stackra:routing:require-role";
export const REQUIRE_PERMISSION_METADATA_KEY =
  "stackra:routing:require-permission";

export const MIDDLEWARE_REGISTRY = Symbol.for("MIDDLEWARE_REGISTRY");
export const MIDDLEWARE_RESOLVER = Symbol.for("MIDDLEWARE_RESOLVER");
export const GUARD_REGISTRY = Symbol.for("GUARD_REGISTRY");
export const ROUTE_MATCHER_SERVICE = Symbol.for("ROUTE_MATCHER_SERVICE");
export const ROUTE_MODE_SERVICE = Symbol.for("ROUTE_MODE_SERVICE");
export const ROUTING_CONFIG = Symbol.for("ROUTING_CONFIG");
export const SEO_SERVICE = Symbol.for("SEO_SERVICE");
export const ROUTE_ANALYTICS_SERVICE = Symbol.for("ROUTE_ANALYTICS_SERVICE");
```

### `packages/contracts/src/interfaces/routing/`

- `route.interface.ts` — `IRouteRecord`, `IRouteModule`, `IMatchDescriptor`,
  `IBreadcrumbContext`
- `guard.interface.ts` — `ICanActivate`, `IGuardContext`, `IGuardDecision`,
  `IGuardOptions`, `IGuardRef`
- `middleware.interface.ts` — `IMiddlewareContext`, `IMiddlewareNext`,
  `IMiddlewareOptions`, `MiddlewareStage`, `IMiddlewareGroup`, `IMiddlewareRef`
- `seo.interface.ts` — `ISeoDescriptor`, `IOpenGraph`, `ITwitterCard`,
  `IRobotsDirectives`, `ISeoContext`
- `prerender.interface.ts` — `IPrerenderSpec`
- `signal.interface.ts` — `IRedirectSignal`, `INotFoundSignal`, `IAbortSignal`
- `mode.interface.ts` — `IRouteMode`, `IOverlayOptions`
- `matcher.interface.ts` — `IRouteMatcher`, `IMatchContext`
- `access.interface.ts` — `IAccessSpec`
- `analytics.interface.ts` — `IRouteAnalytics`, `IAnalyticsEventDefinition`,
  `IAnalyticsEventCatalog`
- `breadcrumb.interface.ts` — `IBreadcrumbEntry`
- `rrv7/index.ts` — RRv7 type re-exports (see
  [Route type system](#route-type-system))

### Removed from contracts

- `SSR_CONFIG`, `SSR_RENDERER`, `SSR_EVENTS`, `SSR_MODULE_OPTIONS`
- `API_ROUTE_REGISTRY`, `API_ROUTE_METADATA_KEY`, `IApiRouteMetadata`,
  `API_ROUTE_MATCHED`
- `ROUTE_REGISTRY`, `ROUTE_METADATA_KEY`, `IRouteMetadata`, `ROUTE_MATCHED`,
  `ROUTE_SYNC`, `ROUTE_REGISTERED`

---

## Decorators additions

### `packages/decorators/src/routing/` (new subpath)

- `middleware.decorator.ts` — `@Middleware(options)` via factory
- `guard.decorator.ts` — `@Guard(options)` via factory
- `global-middleware.decorator.ts` — `@GlobalMiddleware(options)` shortcut
- `global-guard.decorator.ts` — `@GlobalGuard(options)` shortcut
- `require-role.decorator.ts` — `@RequireRole('admin')`
- `require-permission.decorator.ts` — `@RequirePermission('users.viewAll')`
- `require-any.decorator.ts` —
  `@RequireAny([{role: 'admin'}, {permission: 'x'}])`

### Support additions

`packages/support/src/utils/mapped-types/` — copy of NestJS `mapped-types`,
TS-level only:

- `partial-type.util.ts`
- `pick-type.util.ts`
- `omit-type.util.ts`
- `intersection-type.util.ts`

Re-exported through `packages/support/src/index.ts`.

---

## Full usage

Every feature in one snippet.

### `apps/dashboard/src/analytics.events.ts`

```typescript
import { defineEvents } from "@stackra/analytics";

export const events = defineEvents({
  view_pricing: { tier: "public" as const },
  view_blog_post: { slug: "" as string, category: "" as string },
  sign_up: { method: "email" as "email" | "sso" },
});

export type AppEvents = typeof events;
```

### `apps/dashboard/src/middleware/audit.middleware.ts`

```typescript
import { Inject } from "@stackra/container";
import { Middleware } from "@stackra/decorators/routing";
import type {
  IMiddlewareContext,
  IMiddlewareNext,
  ILoggerManager,
} from "@stackra/contracts";
import { LOGGER_MANAGER } from "@stackra/contracts";

@Middleware({ name: "audit", priority: 100, global: true, group: "@web" })
export class AuditMiddleware {
  public constructor(
    @Inject(LOGGER_MANAGER) private readonly logger: ILoggerManager,
  ) {}

  public async handle(
    ctx: IMiddlewareContext,
    next: IMiddlewareNext,
  ): Promise<unknown> {
    const startedAt = performance.now();
    const result = await next();
    this.logger
      .create("http")
      .info(`${ctx.request.method} ${ctx.url.pathname}`, {
        durationMs: performance.now() - startedAt,
        userId: ctx.state.user?.id,
      });
    return result;
  }
}
```

### `apps/dashboard/src/guards/auth.guard.ts`

```typescript
import { Inject } from "@stackra/container";
import { Guard } from "@stackra/decorators/routing";
import type {
  ICanActivate,
  IGuardContext,
  IGuardDecision,
  IAuthService,
} from "@stackra/contracts";
import { AUTH_SERVICE } from "@stackra/contracts";

@Guard({ name: "auth", priority: 1000, group: "@authenticated" })
export class AuthGuard implements ICanActivate {
  public constructor(
    @Inject(AUTH_SERVICE) private readonly auth: IAuthService,
  ) {}

  public async canActivate(
    ctx: IGuardContext,
  ): Promise<boolean | IGuardDecision> {
    const user = await this.auth.userFromRequest(ctx.request);
    if (!user) {
      const next = encodeURIComponent(ctx.url.pathname + ctx.url.search);
      return { redirect: `/sign-in?next=${next}` };
    }
    ctx.state.user = user;
    return true;
  }
}
```

### `apps/dashboard/src/pages/blog-post.tsx` (colocated route module)

```typescript
import type {
  IRrvLoaderArgs,
  ISeoContext,
  IBreadcrumbContext,
} from "@stackra/contracts";
import { article } from "@stackra/routing/seo";
import { fetchBlogPost, fetchBlogSlugsFromCms } from "@/lib/cms";

export default function BlogPostPage() {
  // component body
  return null;
}

export const loader = async ({ params }: IRrvLoaderArgs<{ slug: string }>) =>
  fetchBlogPost(params.slug);

export const prerender = async () => {
  const slugs = await fetchBlogSlugsFromCms();
  return slugs.map((slug) => ({ slug }));
};

export const seo = ({
  loaderData,
}: ISeoContext<{ slug: string }, Awaited<ReturnType<typeof loader>>>) => ({
  title: loaderData.title,
  description: loaderData.excerpt,
  canonical: `/blog/${loaderData.slug}`,
  openGraph: {
    type: "article",
    images: [{ url: loaderData.coverUrl, width: 1200, height: 630 }],
  },
  jsonLd: [
    article({
      headline: loaderData.title,
      datePublished: loaderData.publishedAt,
      authorName: loaderData.authorName,
      image: loaderData.coverUrl,
    }),
  ],
});

export const breadcrumb = ({
  loaderData,
}: IBreadcrumbContext<{ slug: string }, Awaited<ReturnType<typeof loader>>>) =>
  loaderData.title;

export const analytics = {
  name: "view_blog_post",
  properties: { slug: "", category: "" },
} as const;
```

### `apps/dashboard/src/routes.ts`

```typescript
import { defineRoute, defineMiddlewareGroup } from "@stackra/routing";
import { faqPage, organization } from "@stackra/routing/seo";

import { RootLayout } from "@/layouts/root-layout";
import { AuthLayout } from "@/layouts/auth-layout";
import { AppShell } from "@/layouts/app-shell";

import { HomePage, HomePageSkeleton } from "@/pages/home";
import { PricingPage } from "@/pages/pricing";
import { SignInPage, SignUpPage } from "@/pages/auth";
import {
  DashboardPage,
  DashboardSkeleton,
  DashboardError,
} from "@/pages/dashboard";
import { SettingsPage, AdminUsersPage, NoUsersYet } from "@/pages/settings";
import { UserDetailSheet } from "@/pages/user-detail";
import { GlobalErrorFallback, GlobalNotFoundFallback } from "@/pages/errors";

import { AuthGuard, RoleGuard } from "@/guards";
import type { AppEvents } from "./analytics.events";

export const webGroup = defineMiddlewareGroup({
  name: "@web",
  middleware: ["session", "audit"],
});

export const routes = [
  defineRoute<AppEvents>({
    path: "/",
    Component: RootLayout,
    ErrorComponent: GlobalErrorFallback,
    NotFoundComponent: GlobalNotFoundFallback,
    seo: {
      titleTemplate: "%s | Stackra",
      openGraph: { siteName: "Stackra", locale: "en_US" },
      twitter: { card: "summary_large_image", site: "@stackra" },
      robots: { index: true, follow: true, maxImagePreview: "large" },
      jsonLd: [
        organization({ name: "Stackra", url: "https://stackra.app" }),
      ],
    },
    middleware: ["@web"],

    children: [
      // ── Public — pre-rendered ──────────────────────────────────
      defineRoute<AppEvents>({
        index: true,
        Component: HomePage,
        LoadingComponent: HomePageSkeleton,
        prerender: true,
        seo: {
          title: "The academy operating system",
          description: "Run your academy on one platform.",
        },
        breadcrumb: "Home",
      }),

      defineRoute<AppEvents>({
        path: "pricing",
        Component: PricingPage,
        prerender: true,
        seo: {
          title: "Pricing",
          description: "Simple, transparent pricing.",
          canonical: "/pricing",
          jsonLd: [
            faqPage([
              { question: "Is there a free trial?", answer: "Yes, 14 days." },
              { question: "Can I cancel any time?", answer: "Yes." },
            ]),
          ],
        },
        analytics: { name: "view_pricing", properties: { tier: "public" } },
      }),

      // ── Public dynamic — colocated module ──────────────────────
      defineRoute<AppEvents>({
        path: "blog/:slug",
        lazy: () => import("@/pages/blog-post"), // loader, prerender, seo, breadcrumb come from module
      }),

      // ── Auth — SPA, no pre-render, no guard ────────────────────
      defineRoute<AppEvents>({
        Component: AuthLayout,
        children: [
          defineRoute<AppEvents>({
            path: "sign-in",
            Component: SignInPage,
            seo: { title: "Sign in" },
          }),
          defineRoute<AppEvents>({
            path: "sign-up",
            Component: SignUpPage,
            seo: { title: "Sign up" },
          }),
        ],
      }),

      // ── Authenticated app ──────────────────────────────────────
      defineRoute<AppEvents>({
        Component: AppShell,
        guards: [AuthGuard],
        middleware: ["@authenticated"],
        children: [
          defineRoute<AppEvents>({
            path: "dashboard",
            Component: DashboardPage,
            LoadingComponent: DashboardSkeleton,
            ErrorComponent: DashboardError,
            seo: {
              title: "Dashboard",
              robots: { index: false, follow: false },
            },
            breadcrumb: "Dashboard",
          }),
          defineRoute<AppEvents>({
            path: "dashboard/settings",
            Component: SettingsPage,
            seo: { title: "Settings" },
            breadcrumb: "Settings",
          }),
          defineRoute<AppEvents>({
            path: "dashboard/admin/users",
            Component: AdminUsersPage,
            access: { roles: ["admin"] }, // ← sugar over guards: [RoleGuard('admin')]
            loader: async () => fetchUsers(),
            isEmpty: (data) => data.length === 0,
            EmptyComponent: NoUsersYet,
            seo: { title: "Users" },
            breadcrumb: "Users",
          }),

          // ── Overlay route — sheet mode ───────────────────────
          defineRoute<AppEvents>({
            path: "dashboard/users/:id",
            Component: UserDetailSheet,
            mode: "sheet",
            overlay: {
              size: "md",
              side: "right",
              dismissible: true,
              onDismiss: "back",
              fallbackRoute: "/dashboard/admin/users",
            },
            loader: async ({ params }) => fetchUser(params.id),
            seo: ({ loaderData }) => ({ title: loaderData.name }),
          }),
        ],
      }),

      // ── Advanced matcher — admin subdomain ─────────────────────
      defineRoute<AppEvents>({
        path: "/*",
        match: { subdomain: "admin" },
        Component: AdminShell,
        guards: [AuthGuard, RoleGuard("platform-admin")],
      }),
    ],
  }),
];
```

### `apps/dashboard/src/layouts/root-layout.tsx`

```typescript
import {Outlet} from '@stackra/routing/react';
import {SeoHead, Links, Scripts, A11yAnnouncer, OverlayOutlet} from '@stackra/routing/react';

export function RootLayout() {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.svg" />
        <SeoHead />
        <Links />
      </head>
      <body>
        <div id="root">
          <Outlet />          {/* page routes render here */}
          <OverlayOutlet />   {/* dialog / drawer / sheet routes render here */}
        </div>
        <A11yAnnouncer />
        <Scripts />
      </body>
    </html>
  );
}
```

### `apps/dashboard/react-router.config.ts` (Node build-time)

```typescript
import { defineRouterConfig } from "@stackra/routing/config";
import { routes } from "./src/routes";

// `ssr` field is not part of the interface — hardcoded false.
// `prerender` is derived from every route's prerender spec.
export default defineRouterConfig({ routes });
```

### `apps/dashboard/vite.config.ts`

```typescript
import { defineConfig } from "vite";
import { router } from "@stackra/routing/vite";

export default defineConfig({
  plugins: [router()],
});
```

### `apps/dashboard/src/app.module.ts`

```typescript
import { Module } from "@stackra/container";
import { RoutingModule } from "@stackra/routing";

import { AuditMiddleware } from "@/middleware/audit.middleware";
import { AuthGuard } from "@/guards/auth.guard";

@Module({
  imports: [RoutingModule.forRoot({ basename: "/" })],
  providers: [
    AuditMiddleware, // @Middleware(global: true) — auto-registered globally
    AuthGuard, // @Guard(group: '@authenticated') — auto-registered in group
  ],
})
export class AppModule {}
```

### `apps/dashboard/src/providers.tsx` (renamed from `App.tsx`, pure providers)

```typescript
import type {ReactNode} from 'react';
import {ContainerProvider} from '@stackra/container/react';
import {RealtimeProvider} from '@stackra/realtime';
import {NotificationTransportProvider} from '@stackra/notifications';

// The former `<ThemeProvider>` / `<LocaleProvider>` are gone — theme
// and locale live as services on the DI container (see
// `@/services/theme` + `@/services/locale`). Components read them
// through the `useTheme()` / `useLocale()` hooks (implemented via
// `useInject` + `useSyncExternalStore`) — no provider mount needed.

export function Providers({children}: {children: ReactNode}) {
  return (
    <ContainerProvider>
      <RealtimeProvider>
        <NotificationTransportProvider>{children}</NotificationTransportProvider>
      </RealtimeProvider>
    </ContainerProvider>
  );
}
```

### `apps/dashboard/src/main.tsx`

```typescript
import 'reflect-metadata';

import {createRoot} from 'react-dom/client';
import {ApplicationFactory} from '@stackra/container';
import {RouterProvider, createBrowserRouter, toRRv7Routes} from '@stackra/routing/react';

import {AppModule} from '@/app.module';
import {Providers} from '@/providers';
import {routes} from '@/routes';

async function bootstrap(): Promise<void> {
  await ApplicationFactory.create(AppModule);
  const router = createBrowserRouter(toRRv7Routes(routes));

  createRoot(document.getElementById('root')!).render(
    <Providers>
      <RouterProvider router={router} />
    </Providers>,
  );
}

void bootstrap();
```

---

## Migration steps

Executed in order. Each step green before moving to the next.

### 1. Contracts additions

- Add `packages/contracts/src/tokens/routing.tokens.ts` with all keys + tokens
  listed above.
- Add `packages/contracts/src/interfaces/routing/` with all interfaces (route,
  guard, middleware, seo, prerender, mode, matcher, access, analytics,
  breadcrumb, rrv7 re-exports).
- Update `packages/contracts/src/tokens/index.ts` +
  `packages/contracts/src/interfaces/index.ts` barrels.
- Build `@stackra/contracts` — green.

### 2. Support additions

- Copy `.ref/mapped-types-master` into
  `packages/support/src/utils/mapped-types/` (TS-only, drop runtime).
- Update `packages/support/src/index.ts` barrel.
- Build `@stackra/support` — green.

### 3. Decorators additions

- Add `packages/decorators/src/routing/` with `@Middleware`, `@Guard`,
  `@GlobalMiddleware`, `@GlobalGuard`, `@RequireRole`, `@RequirePermission`,
  `@RequireAny`.
- Update `packages/decorators/tsup.config.ts` + `package.json` exports.
- Build `@stackra/decorators` — green.

### 4. Analytics update

- Add `defineEvents<Catalog>()` factory to `packages/analytics/src/index.ts`.
- Update contracts with `IAnalyticsEventCatalog` / `IAnalyticsEventDefinition`.
- Build `@stackra/analytics` — green.

### 5. Create `@stackra/routing`

- Scaffold `packages/routing/` with layout above.
- Copy middleware pipeline from `packages/ssr/src/core/middleware/`.
- Copy SEO from `packages/ssr/src/core/seo/`.
- Add `defineRoute`, `defineRouterConfig`, `defineMiddleware`, `defineGuard`,
  `toRRv7Routes`, `collectPrerenderPaths`.
- Add slot-aware route runtime binding.
- Add `<SeoHead />`, `<Links />` (passthrough), `<Scripts />` (csp-aware),
  `<A11yAnnouncer />`, `<Link>`, `<Breadcrumbs>`, `<OverlayOutlet>`.
- Add framework-default fallbacks in `fallbacks/`.
- Add `useBreadcrumbs()`, `useBreadcrumb()`, `useRouteState()`,
  `useRouteMode()`, `useRouteAnalytics()`.
- Add `GuardAdapter` service that converts guards to middleware entries.
- Add `RouteMatcherService` for subdomain/query/header matching.
- Add `RouteModeService` for overlay orchestration.
- Add re-exports of RRv7 primitives in `react/react-router.re-exports.ts`.
- Add `router()` Vite plugin re-export in `vite/router-plugin.ts`.
- Build `@stackra/routing` — green.

### 6. Refactor dashboard

- Install `@react-router/dev` (dev dep).
- Create `apps/dashboard/react-router.config.ts` using `defineRouterConfig`.
- Swap `stackraSsr()` plugin for `router()` in `apps/dashboard/vite.config.ts`.
- Rename `apps/dashboard/src/App.tsx` → `apps/dashboard/src/providers.tsx`,
  strip routing + Refine, keep provider stack only.
- Rewrite `apps/dashboard/src/main.tsx` — `<Providers>` wraps
  `<RouterProvider>`.
- Port every route definition to `defineRoute` in
  `apps/dashboard/src/routes.ts`.
- Create `apps/dashboard/src/layouts/root-layout.tsx` with `<SeoHead />` /
  `<Links />` / `<Scripts />` composition.
- Colocate route metadata where sensible (blog-post as example).
- Update `apps/dashboard/package.json`: replace `@stackra/ssr` with
  `@stackra/routing`, add `@react-router/dev`.

### 7. Contracts cleanup

- Delete unused SSR-only tokens/interfaces from `@stackra/contracts`.
- Rebuild — green.

### 8. Delete `@stackra/ssr`

- Delete `packages/ssr/` folder entirely.
- Remove `@stackra/ssr` references from every workspace `package.json`.
- `pnpm install` — no unresolved refs.

### 9. Full workspace build

- Build every promoted package in dep order:
  `contracts → testing → container → decorators → support → pipeline → logger → events → analytics → ui → error → network → cache → queue → routing`
- Build dashboard.
- Run `pnpm --filter @stackra/dashboard exec vite build`.

---

## Verification

- `curl http://<host>/pricing | grep '<title>Pricing'` — SEO baked in.
- View-source on `/blog/first-post` shows full article HTML with JSON-LD script.
- Google/Lighthouse SEO ≥ 95 on any pre-rendered page.
- `/dashboard` returns the SPA shell; unauthenticated user redirected to
  `/sign-in` client-side via `AuthGuard`.
- Route transitions show `PendingComponent` when defined; framework default
  fallback otherwise.
- Loader errors render `ErrorComponent`; `notFound()` signal renders
  `NotFoundComponent`.
- Overlay routes (`mode: 'sheet'`) render as HeroUI Pro sheet with parent
  visible underneath; deep-linking works.
- Subdomain matchers route `admin.example.com` to `AdminShell`.
- Query matchers switch `/edit?mode=advanced` variant.
- Global middleware / guards auto-registered by discovery.
- Group refs (`middleware: ['@web']`) resolve correctly.
- `<Breadcrumbs>` renders the trail from route `breadcrumb` fields.
- Analytics event fires on each navigation with correct name + properties
  (typed).
- CSP nonce (when `@stackra/csp` wired) present on all injected scripts.

---

## Open questions

1. **Prerender param shape** — return param bags (proposed) or full paths.
   **Proposal: bags.**
2. **Middleware inheritance direction** — concat parent-then-child (proposed) or
   override. **Proposal: concat.**
3. **`seo` closure args** — `{loaderData, params}` (proposed) or add
   `{request, url}`. **Proposal: start with `{loaderData, params}`; extend if
   needed.**
4. **`<A11yAnnouncer />` scope** — announce every navigation (proposed) or
   opt-in via `handle.announce: false`. **Proposal: announce every navigation;
   add opt-out if noise becomes an issue.**
5. **Custom async matchers at build time** — for advanced matchers, whether
   `custom: async (ctx) => boolean` is honored during prerender (currently
   runtime-only). **Proposal: runtime-only for v1; add build support later if
   needed.**

Every other decision is locked. Say **go** to execute.
