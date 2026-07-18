# Events Authoring

Rules for how events are declared, emitted, listened to, and traced across every
`@stackra/*` package and `@stackra/*`-driven app. Read alongside
`communication-patterns.md` (which decides when an event is the right primitive
at all) and `code-standards.md` (which decides where the event files live).

Events are Lane 3 in `communication-patterns.md`. Once you've picked Lane 3,
THIS document decides the shape.

## The three pillars

Every event lives in three places:

1. **A constant** — the string name lives in a `<name>.events.ts` file inside
   the OWNING package. Never an inline string at a call site.
2. **A payload type** — an interface describing what `emit(name, payload)`
   accepts. Lives beside the constant OR in the owning package's `interfaces/`.
3. **A discovery docblock** — every event carries a docblock naming the emitter
   and every current listener. Reviewers reject events without one.

Everything else in this document flows from those three.

## Rule — every package's events live under a constant

An `@stackra/*` package that emits events ships a `<name>.events.ts` file. The
exported constant is a plain object frozen `as const` so consumers get literal
string types.

`<name>.events.ts` is the codified plural exception to `code-standards.md`'s
"one export per file" rule — an event catalogue IS the export (one map holds
every event a package owns).

```typescript
// packages/network/src/core/events/network.events.ts

/**
 * @file network.events.ts
 * @module @stackra/network/core/events
 * @description Canonical event names emitted by the network module.
 *
 *   Import from `@stackra/network` (via `NETWORK_EVENTS`) — never
 *   inline a raw string. The `as const` freeze lets TypeScript
 *   narrow the emit + listen call sites to literal string types.
 */

export const NETWORK_EVENTS = {
  /**
   * The device came online.
   *
   * ## Emitters
   * - `NetworkService.markOnline(...)` (network package).
   *
   * ## Current listeners
   * - `apps/dashboard/src/lib/network/offline-banner.tsx`
   *   → dismisses the offline banner.
   * - `apps/dashboard/src/lib/query/retry-scheduler.ts`
   *   → flushes the queued requests.
   * - `@stackra/realtime/react-listener.ts`
   *   → reopens the websocket connection.
   *
   * ## Order
   * Undefined — listeners react independently. Do not rely on order.
   */
  ONLINE: "network.online",

  /**
   * The device went offline.
   *
   * ## Emitters
   * - `NetworkService.markOffline(...)` (network package).
   *
   * ## Current listeners
   * - `apps/dashboard/src/lib/network/offline-banner.tsx`
   *   → shows the offline banner.
   * - `apps/dashboard/src/lib/query/retry-scheduler.ts`
   *   → pauses new outgoing requests.
   *
   * ## Order
   * Undefined.
   */
  OFFLINE: "network.offline",
} as const;

/** The union of every event name owned by the network package. */
export type NetworkEventName =
  (typeof NETWORK_EVENTS)[keyof typeof NETWORK_EVENTS];
```

Filename: `<package>.events.ts`. Home folder: `events/` (per
`code-standards.md`'s per-category folder rule).

Constant name: `<PACKAGE>_EVENTS` — SCREAMING_SNAKE_CASE.

Field name: SCREAMING_SNAKE_CASE key, dotted lowercase value
(`"user.registered"`, `"network.online"`, `"auth.expired"`).

## Rule — every event has a typed payload

The payload is an interface, kept beside the constants (as a family under
`code-standards.md`'s React-entity exception is NOT applicable here — see below
for the composite-family rule).

```typescript
// packages/user/src/core/interfaces/user.events.interface.ts

/**
 * @file user.events.interface.ts
 * @module @stackra/user/core/interfaces
 * @description Payload types for every event owned by the user module.
 *
 *   Consumers of `@OnEvent(USER_EVENTS.REGISTERED)` type their
 *   handler argument as `IUserRegisteredPayload` — never `any`,
 *   never `unknown` (unless the payload really is opaque).
 */

/** Payload for `USER_EVENTS.REGISTERED`. */
export interface IUserRegisteredPayload {
  readonly userId: string;
  readonly email: string;
  readonly registeredAt: string;
}

/** Payload for `USER_EVENTS.DELETED`. */
export interface IUserDeletedPayload {
  readonly userId: string;
  readonly deletedAt: string;
  readonly reason: "self" | "admin" | "gdpr";
}
```

Payload types follow the interface naming convention from `code-standards.md`
(§React-entity exception applies to component props, NOT to event payloads —
those follow the general one-interface-per-file rule).

## Rule — every emit uses the constant

Never emit a raw string. The constant is the source of truth for the name; the
type system fails a typo at compile time.

```typescript
// WRONG — inline string, no compile-time check on the payload.
this.events.emit("user.registered", { userId, email });

// RIGHT — constant + typed payload.
this.events.emit(USER_EVENTS.REGISTERED, {
  userId,
  email,
  registeredAt,
} satisfies IUserRegisteredPayload);
```

## Rule — every listener uses `@OnEvent` (class) or `useOnEvent` (React)

Two idiomatic listeners, one per context:

### Class listeners — `@OnEvent`

Non-React consumers register via the `@OnEvent(NAME)` decorator on an
`@Injectable()` service. Discovery picks it up automatically (per
`discovery-vs-loader.md`).

```typescript
/**
 * @file welcome-email-listener.service.ts
 * @module @stackra/notifications/core/services
 * @description Listener that fires the welcome email when a user
 *   registers.
 *
 *   Reacts to: `USER_EVENTS.REGISTERED` (payload:
 *   `IUserRegisteredPayload`).
 *   Emitted by: `UserService.register(...)` (user package).
 *   Sibling listeners on the same event:
 *   - `analytics/track-registration-listener.service.ts`
 *   - `onboarding/seed-first-run-tour-listener.service.ts`
 */
@Injectable()
export class WelcomeEmailListener {
  public constructor(
    @Inject(EMAIL_SERVICE) private readonly email: IEmailService,
  ) {}

  @OnEvent(USER_EVENTS.REGISTERED)
  public async handle(payload: IUserRegisteredPayload): Promise<void> {
    await this.email.send({
      to: payload.email,
      template: "welcome",
      data: { registeredAt: payload.registeredAt },
    });
  }
}
```

### React listeners — `useOnEvent`

React consumers register via a `useOnEvent(NAME, handler, deps?)` hook. The
subscription auto-unregisters on unmount.

```typescript
/**
 * @file use-show-welcome-toast.hook.ts
 * @module apps/dashboard/src/hooks/use-show-welcome-toast
 * @description Toast the newly-registered user.
 *
 *   Reacts to: `USER_EVENTS.REGISTERED`.
 *   Sibling listeners: see `WelcomeEmailListener`,
 *   `AnalyticsTrackRegistrationListener`,
 *   `OnboardingSeedFirstRunTourListener`.
 */
export function useShowWelcomeToast(): void {
  useOnEvent(USER_EVENTS.REGISTERED, (payload: IUserRegisteredPayload) => {
    toast.success(`Welcome, ${payload.email}!`);
  });
}
```

The hook signature (shipped from `@stackra/events/react` — or promoted there):

```typescript
export function useOnEvent<TName extends string, TPayload>(
  name: TName,
  handler: (payload: TPayload) => void | Promise<void>,
  deps?: readonly unknown[],
): void;
```

`deps` mirrors `useEffect` — omit for a stable handler; include when the handler
closes over changing values.

## Rule — the discovery docblock is mandatory

Every event (in the constants file) AND every listener (class OR hook) carries a
docblock that answers three questions:

1. **Who emits it?** (One method or many? Which package?)
2. **Who listens today?** (Every current subscriber, path + one-line intent.)
3. **Is order deterministic?** (Yes — document. No — say so explicitly.)

The docblock is checked at PR review. Without it, an event is untraceable — you
can't answer "if I change this payload, what breaks?" without grepping the whole
workspace.

This is the discovery CONTRACT — not a hint. Missing docblock = rejected PR.

### Keeping the docblock accurate

When you add a listener, you also update the constant's docblock (one line added
under "Current listeners"). When you remove a listener, you remove its line. The
two live together in the same commit.

**Automation hook (future):** a workspace grep can walk every `@OnEvent(NAME)` +
`useOnEvent(NAME, ...)` site and reconcile them against the constant's docblock.
Divergence fails CI. Not shipped today; discipline enforces it in the meantime.

## Rule — payloads are stable; break carefully

Adding an OPTIONAL field to a payload interface is safe. Removing a field,
changing a field's type, or renaming a field is BREAKING.

Breaking payload changes require:

1. A new event name — do not silently reshape an existing event.
   `user.registered` stays; the new shape ships as `user.registered.v2`.
2. Both events emit in parallel for one release cycle.
3. Every listener migrates to v2 in that cycle.
4. `user.registered` (v1) removed in the next major.

Same rule as HTTP API versioning. Once an event is emitted, its payload is a
contract with N unknown consumers.

## Rule — the package that OWNS a domain owns its events

Events describe things that happen in a domain. The package that OWNS the domain
owns the event names + payloads.

- `USER_EVENTS.REGISTERED` — owned by the user package.
- `NETWORK_EVENTS.ONLINE` — owned by the network package.
- `AUTH_EVENTS.EXPIRED` — owned by the auth package.
- `ROUTING_EVENTS.CHANGED` — owned by the routing package.

Consumers import from the owner. The owner never re-exports events from
`@stackra/contracts` (per `contract-reexports.md`); listeners import
`USER_EVENTS` from `@stackra/user`, not from `@stackra/contracts`.

**Exception**: cross-package events that describe FRAMEWORK-LEVEL lifecycle
(e.g. `application.bootstrapped`) belong in `@stackra/contracts` because no
single package owns "the framework". Kept small; not a dumping ground.

## Rule — pick the right verb tense

Event names describe things that HAPPENED, not things you WANT to happen. Past
tense for the observation. An imperative name (`load`, `register`, `send`)
signals you picked the wrong lane — that's a direct method call (Lane 1 / DI),
not an event.

```
✓ user.registered      // event — user was registered
✓ user.deleted         // event — user was deleted
✓ auth.expired         // event — the token expired

✗ user.register        // this is a direct call — use Lane 1 (DI)
✗ user.deleting        // this is speculative, not observed
✗ users.load           // this is a direct call — use Lane 1 (DI)
```

Ask: does the caller want to make it happen (direct call → Lane 1 / DI) or
observe that it happened (Lane 3 / event)?

## Rule — one event per fact

Do not overload one event to describe multiple different facts.

```
✗ USER_EVENTS.CHANGED { type: 'created' | 'updated' | 'deleted', ... }

✓ USER_EVENTS.CREATED { ... }
✓ USER_EVENTS.UPDATED { ... }
✓ USER_EVENTS.DELETED { ... }
```

Reasoning: listeners filter on `type` inside the handler, which forces them to
declare interest in facts they don't care about. Separate events let subscribers
subscribe precisely to what they need — and the type system enforces the payload
shape per event, not per discriminant.

## Rule — cross-tier events cross a boundary explicitly

An event owned by a Node-only package (e.g. queue processor events) that a
browser listener needs must transit an explicit boundary. Browsers cannot
subscribe to Node process events directly. The boundary is a websocket, an SSE
stream, or a poll — but always explicit. Never assume `emit()` in one runtime
reaches a listener in the other.

`@stackra/realtime` is the standard bridge. If a browser needs to observe a
Node-emitted event, `@stackra/realtime` republishes it over the websocket
transport under the same name.

## Enforcement

Zero-hit greps that must pass:

- `emit\(['"]` — every emit uses a constant, never a raw string. (Exception:
  documentation examples; those are `.md` files not `.ts`, so the pattern is
  scoped to `**/*.ts`.)
- `\.emit\(['"]` on any expression — same as above with the receiver.
- `@OnEvent\(['"]` — every `@OnEvent` uses a constant. Zero raw strings.
- `useOnEvent\(['"]` — same.
- `[A-Z_]+_EVENTS = ` outside a `*.events.ts` file — zero hits (event maps live
  in the canonical filename).
- `NETWORK_EVENTS\..*|USER_EVENTS\..*` in a file whose docblock doesn't include
  a "Reacts to" line — flagged for review.
- `@stackra/contracts` importing an event map that isn't framework-level
  lifecycle — zero hits.

## Discovery — answering "who listens to X?"

Two ways, both should be trivial:

1. **Read the constant's docblock.** Every current listener is named there.
2. **Grep.** `@OnEvent(USER_EVENTS.REGISTERED)` and
   `useOnEvent(USER_EVENTS.REGISTERED` should surface every subscriber. If the
   grep finds a listener the docblock doesn't mention, the docblock is out of
   sync — fix in the same PR.

## When you're tempted

- **"An event with a callback that returns a value is fine."** No — that's a
  direct call in disguise. Events are fire-and-forget. If you need a return
  value, use Lane 1 (DI): import the service and call the method. Reinventing
  request/reply on top of events is the failure mode called out in
  `communication-patterns.md`.

- **"I'll add a boolean to the payload to select a listener."** No — every
  listener reacts to every emit of the event. Filter inside the handler. Or
  split into two events.

- **"I'll emit an event to trigger a specific service method."** No — that's a
  direct call (Lane 1). Events are for FAN-OUT to unknown / unrelated consumers,
  not for calling one known thing.

- **"The docblock is out of date; someone else can update it."** No — you added
  the listener; you update the docblock in the same commit. This is how the
  discovery contract survives.

## Cross-references

- `communication-patterns.md` — the three-lane rule; when events are the right
  primitive.
- `code-standards.md` — where `*.events.ts` and payload interfaces live.
- `documentation.md` — the docblock format used above.
- `contract-reexports.md` — feature packages don't re-export event maps through
  `@stackra/contracts`.
- `discovery-vs-loader.md` — how discovery-based listener registration works.
- `module-lifecycle.md` — subscribers register at `OnApplicationBootstrap`.
