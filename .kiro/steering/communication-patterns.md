# Communication Patterns

Rules for how any two pieces of code inside a `@stackra/*` package or inside a
`@stackra/*`-driven app talk to each other. Every cross-cutting communication
lands in exactly one of three lanes. The lane is determined by the SHAPE of the
interaction, not by preference.

Read alongside `events-authoring.md` (which decides how events are named,
catalogued, and documented once you've picked Lane 3).

## The three lanes

| Lane | Primitive                                       | Shape                     | Direction                         | Best for                                                              |
| ---- | ----------------------------------------------- | ------------------------- | --------------------------------- | --------------------------------------------------------------------- |
| 1    | **DI** — `@Inject()` / `useInject(TOKEN)`       | Direct method call        | 1 → 1                             | Call a known service; need a return value or need to know it happened |
| 2    | **React context** — `<Provider>` + `useX()`     | Value lookup              | 1 → N descendants, subtree-scoped | Value varies by subtree, many descendants read it                     |
| 3    | **Events** — `@OnEvent` / `emit(NAME, payload)` | Fire-and-forget broadcast | 1 → N unknown                     | One thing happens, many _unrelated_ concerns react                    |

**There is no fourth lane.** In-process, typed, single-tenant JS (browser or
Node) does not need a message bus for request/response. Direct DI is the
fastest, cleanest primitive for "call a specific target and get a value back" —
better types, cleaner stack traces, zero indirection. NestJS-style
`@MessagePattern` earns its place when you have MULTIPLE transports (NATS,
Redis, gRPC, WS, HTTP) that need one handler — a wire-crossing problem the
frontend does not have. If a specific transport ever ships (web-worker RPC,
cross-tab BroadcastChannel, custom protocol) it grows its own request/response
primitive alongside its transport — not a workspace-wide bus.

## Rule — decision tree

Walk this in order. Stop at the first "yes".

```
1. Does the caller need a return value or need to know the action ran?
     yes → Lane 1 (DI) — direct method call.
     no  → continue.

2. Is the value tree-scoped (varies by subtree)?
     yes → Lane 2 (Context) for the value +
           Lane 1 (DI) for the service that reads it +
           composition in a hook.
     no  → continue.

3. Is this "one thing happened, N *unrelated* concerns react"?
     yes → Lane 3 (Events). Publisher never knows subscribers.
     no  → You probably don't need a cross-cutting primitive.
           A direct call inside the same module is fine.
```

If you cannot answer these questions about a call, you're not clear on what the
call is doing. Fix that first, then pick the lane.

**Cross-runtime calls are NOT a fourth lane.** Browser → server RPC is
`@stackra/http` (typed request/response over HTTP). Browser → peer pub/sub is
`@stackra/realtime` (typed events over WebSocket). Those are transports, not
lanes; they carry the same three lanes across a wire.

## Lane 1 — DI (Dependency Injection)

**Use when:** you need to call a specific target and possibly need a return
value.

```typescript
// Producer:
@Injectable()
export class UserService {
  public async listUsers(scope: ITenantScope): Promise<IUser[]> {
    return this.http.get(`/tenants/${scope.id}/users`);
  }
}

// Consumer (React):
function useUsers() {
  const service = useInject<UserService>(USER_SERVICE);
  const scope = useTenantScope();
  return useQuery({
    queryKey: ["users", scope.id],
    queryFn: () => service.listUsers(scope),
  });
}

// Consumer (non-React):
class SomeOtherService {
  public constructor(
    @Inject(USER_SERVICE) private readonly users: UserService,
  ) {}
}
```

- The consumer knows the service (typed).
- The service is a container singleton (or scoped).
- Return values are normal.
- Stack traces are clean; testing is a plain mock.

**Do NOT use DI to fan out to multiple unrelated subscribers.** If the caller
finds itself writing
`analytics.track(...); email.send(...); onboarding.tick(...)` at the same call
site, that's an event pretending to be a method chain — hoist it to Lane 3.

## Lane 2 — React context

**Use when:** a value varies by subtree and multiple descendants read it.

```typescript
// Declared inline with plain React.createContext.
const TenantScopeContext = React.createContext<ITenantScope | null>(null);

// Typed provider.
export function TenantScopeProvider({
  value,
  children,
}: {
  value: ITenantScope;
  children: React.ReactNode;
}): React.ReactElement {
  return (
    <TenantScopeContext.Provider value={value}>
      {children}
    </TenantScopeContext.Provider>
  );
}

// Typed hook that throws with a helpful message when unmounted.
export function useTenantScope(): ITenantScope {
  const scope = React.useContext(TenantScopeContext);
  if (!scope) {
    throw new Error(
      "useTenantScope() called outside <TenantScopeProvider>. " +
        "Mount <TenantScopeProvider value={...}> above the caller.",
    );
  }
  return scope;
}

// Optional variant for the "can be missing" case.
export function useOptionalTenantScope(): ITenantScope | null {
  return React.useContext(TenantScopeContext);
}

// Consumer:
function TenantAwareThing() {
  const scope = useTenantScope();
  // ...
}
```

**Rules for contexts:**

- Contexts are RARE. Only use one when the value legitimately varies by subtree
  (tenant scope, theme override, form-field context, locale). Global values (a
  settings service, a command palette state, an FCM client) belong in the
  container, not in context.
- Every context ships as a triple: `Context`, `Provider`, `useX()` hook +
  optional `useOptionalX()`. The hook is the ONLY supported read path — never
  `React.useContext(SomeContext)` at a call site.
- The hook throws with a specific message when the provider is missing. Copy the
  shape above.
- **Services NEVER read React context.** If a service needs a tree-scoped value,
  the consumer PASSES IT as a method argument. The composition happens in a hook
  (Lane 1 + Lane 2 together — see the `useUsers` example above).

**Do NOT use context to hold a service.** That's Lane 1's job. Signal that you
got this wrong: your `<XProvider>` mostly wraps a `useState` and broadcasts it.
Move the state into an `@Injectable()` service with a `subscribe(cb)` API and
consume via `useInject` + `useSyncExternalStore`.

**Do NOT bind React context values into container tokens** so services can
`@Inject()` them. This creates:

- **Timing mismatch** — services are constructed once; they snapshot the value
  at construction and miss every subsequent context change.
- **Scope mismatch** — the container is app-scoped; React context is
  tree-scoped. Two sibling subtrees clobber each other's writes.
- **Layering violation** — services depend on the React tree; you can't run them
  from a background worker, a test, or a CLI command.
- **Invisible coupling** — `userService.listUsers()` silently depends on the
  last `<TenantScopeProvider>` above the caller.

The clean pattern is composition in a hook (shown above).

## Lane 3 — Events

**Use when:** one thing happens and MULTIPLE UNRELATED concerns react — and the
publisher must not know who's listening.

```typescript
// Emit:
this.events.emit(USER_EVENTS.REGISTERED, {
  userId: user.id,
  email: user.email,
  registeredAt: user.createdAt,
});

// Listen (non-React):
@Injectable()
export class WelcomeEmailListener {
  @OnEvent(USER_EVENTS.REGISTERED)
  public async handle(payload: IUserRegisteredPayload): Promise<void> {
    // ...
  }
}

// Listen (React):
function useShowWelcomeToast() {
  useOnEvent(USER_EVENTS.REGISTERED, (payload) => {
    toast.success(`Welcome, ${payload.email}!`);
  });
}
```

- The publisher emits a typed event. Payload comes from the shared event map
  (see `events-authoring.md`).
- Subscribers register via `@OnEvent(NAME)` (class) or `useOnEvent(NAME, cb)`
  (React).
- The publisher never knows who listens. The listeners never know each other.
- Every event constant lives in a package-owned `<name>.events.ts` file — never
  inline strings.

**Every new `@OnEvent(...)` handler ships with a docblock naming the emitter and
every current listener.** This is the discovery contract — you should never have
to grep the whole workspace to answer "who reacts to `user.registered`?" See
`events-authoring.md`.

**Do NOT invent request/reply on top of events.** Two events (`ask + reply`)
with a correlation id is a bad RPC. If you need a return value, that's Lane 1
(DI) — the caller imports the service and calls it directly.

**Do NOT use events to replace direct calls that need a return value.** Stack
traces stop at `emit()`; you lose "who processed this call?" without the
discovery docblock.

**Do NOT use events for known 1-to-1 method calls.** Events are for FAN-OUT to
unknown / unrelated consumers, not for calling one known thing.

## Failure modes when each is misused

**DI misused as event bus:**

- Producer imports every consumer to call them.
- Circular imports; refactor breaks the whole graph.
- Signal: consecutive `serviceA.x(); serviceB.y(); serviceC.z()` calls where the
  caller doesn't actually care about their return values.

**Context misused as service:**

- `<XProvider>` wraps `useState` and calls it "context" — every state change
  rerenders every consumer of the provider, even ones that only read one field.
- Signal: your provider re-renders trigger cascades that `useSyncExternalStore`
  would slice cleanly.

**Events misused as direct call:**

- Every method becomes `emit + @OnEvent`.
- Return values die → invent request/reply → reinvent RPC badly.
- Stack traces stop at `emit()`; debug becomes archaeology.
- Type safety degrades: payloads drift, consumers silently break.
- Startup ordering becomes fragile.
- Signal: `askUserCreatedEvent` + `userCreatedResponseEvent` patterns.

## Enforcement

The following greps must return the expected result.

- Every `@OnEvent(...)` handler ships with a docblock naming the emitter and
  every current listener → checked per file at PR review.
- Every `emit(NAME, ...)` uses a constant from a `*.events.ts` file, never a raw
  string → grep `emit\(['"]` for zero hits (except documentation examples in
  `.md` files).
- Zero `askX` + `xResponse` event pairs — that's a Lane 1 (DI) call in disguise.
- Zero `@Injectable()` services that call `React.useContext(...)` or read a
  React context directly. Services take tree-scoped values as method arguments
  (composition in a hook).
- Zero context definitions whose provider body is `useState + broadcast`.
  Signal: the state belongs in a container service.

## Cross-references

- `events-authoring.md` — event constants, payload types, discovery.
- `module-lifecycle.md` — `OnModuleInit` / `OnApplicationBootstrap`.
- `discovery-vs-loader.md` — how discovery-based fan-out registers.
- `contract-reexports.md` — where cross-package tokens/interfaces live (feature
  packages don't re-export from `@stackra/contracts`).
