# academorix/events

Attribute-based event listener discovery and broadcasting wiring for
every Academorix app and package. Ships the attributes packages use
in place of `EventServiceProvider::$listen` maps and hand-rolled
`broadcastOn()` / `broadcastAs()` methods on event classes.

Depends on [`academorix/foundation`](../foundation) and hooks into
[`olvlvl/composer-attribute-collector`](https://github.com/olvlvl/composer-attribute-collector)
so listener discovery is a near-zero-cost hashmap lookup at boot —
no per-request reflection.

## What you get

- **`#[OnEvent(Event::class)]`** on a listener class — registers
  the class as a listener for `Event::class`, invoking `handle()`.
- **`#[ListensFor(Event::class, method: 'onFoo')]`** on a method —
  wires that specific method to the event, letting one class
  subscribe to several events.
- **`#[AfterCommit]`** on a listener class — opts every attribute
  on that class into after-commit semantics without repeating
  `afterCommit: true` on each one.
- **`#[Broadcastable]`** on an event class — marks it for
  broadcasting.
- **`#[BroadcastOn('orders.{order->id}')]`** — declarative channel
  list (repeatable).
- **`#[BroadcastAs('orders.created')]`** — custom broadcast name.
- **`#[BroadcastQueue('broadcasts')]`** — custom broadcast queue.

## Quick tour

### Listener side

```php
<?php

declare(strict_types=1);

namespace Academorix\Billing\Listeners;

use Academorix\Billing\Events\{InvoicePaid, InvoiceRefunded};
use Academorix\Events\Attributes\{AfterCommit, ListensFor, OnEvent};

#[OnEvent(InvoicePaid::class, priority: 100)]
#[AfterCommit]
final class SendPaidReceipt
{
    public function handle(InvoicePaid $event): void
    {
        // ...
    }
}
```

Multiple events on one class:

```php
final class InvoiceAuditor
{
    #[ListensFor(InvoicePaid::class, method: 'onPaid')]
    public function onPaid(InvoicePaid $event): void
    {
        // ...
    }

    #[ListensFor(InvoiceRefunded::class, method: 'onRefunded', queued: true)]
    public function onRefunded(InvoiceRefunded $event): void
    {
        // ...
    }
}
```

### Broadcasting side

```php
<?php

declare(strict_types=1);

namespace Academorix\Orders\Events;

use Academorix\Events\Attributes\{Broadcastable, BroadcastAs, BroadcastOn, BroadcastQueue};
use Academorix\Orders\Models\Order;

#[Broadcastable(channelType: 'private')]
#[BroadcastOn('orders.{order->id}')]
#[BroadcastOn('admins')]
#[BroadcastAs('orders.created')]
#[BroadcastQueue('broadcasts')]
final class OrderCreated
{
    public function __construct(public readonly Order $order) {}
}
```

Query the resolved metadata at runtime from anywhere — a shipped
listener, a bespoke broadcaster, or a custom `ShouldBroadcast`
implementation:

```php
use Academorix\Events\Support\BroadcastConfigurator;

$configurator = app(BroadcastConfigurator::class);

$configurator->isBroadcastable(OrderCreated::class);    // true
$configurator->channelsFor($orderCreatedEvent);         // list<Channel>
$configurator->broadcastNameFor(OrderCreated::class);   // 'orders.created'
$configurator->broadcastQueueFor(OrderCreated::class);  // 'broadcasts'
```

## How it works

1. **Build time** — `composer dump-autoload` runs the
   `olvlvl/composer-attribute-collector` plugin, which indexes every
   `#[OnEvent]`, `#[ListensFor]`, `#[Broadcastable]`, `#[BroadcastOn]`,
   `#[BroadcastAs]`, `#[BroadcastQueue]`, and `#[AfterCommit]`
   attribute in the codebase into a static manifest under
   `vendor/attributes.php`.

2. **Boot time** — `EventsServiceProvider::bootBespoke()` asks
   `EventDiscovery` for the resolved manifest. Discovery walks the
   pre-computed manifest (zero reflection) and returns a
   `DiscoveryManifest` containing:

   - a list of `ListenerBinding` records (event → listener class/method,
     priority, queued/afterCommit flags), and
   - a `class-string → BroadcastMetadata` map for every broadcastable
     event class.

3. **Wiring** — the provider iterates the bindings and calls
   `Illuminate\Contracts\Events\Dispatcher::listen()` for each. Queued
   listeners that don't already implement `ShouldQueue` are wrapped
   in a queued closure. After-commit listeners run inside
   `DB::afterCommit(...)`.

4. **Broadcasting** — every discovered `BroadcastMetadata` entry is
   pushed into the singleton `BroadcastConfigurator`. Event classes
   query the configurator instead of implementing `broadcastOn()` /
   `broadcastAs()` themselves.

## Caching

`config/events.php` exposes a `discovery.cache` flag (default: true
in production). When enabled, the resolved manifest is materialised
to `bootstrap/cache/events.php` and reloaded on subsequent boots via
`require`. The cache is invalidated whenever composer regenerates
the underlying attribute-collector manifest — a fresh
`composer dump-autoload` bumps the file's mtime and forces a
re-scan.

Turn caching **off** in local development so newly added listeners
pick up on the next request:

```
EVENTS_DISCOVERY_CACHE=false
```

## Octane safety

Every service the package binds is stateless once populated:

- `EventDiscovery` — pure function from attribute-collector output
  to `DiscoveryManifest`.
- `BroadcastConfigurator` — immutable metadata map populated once
  at boot.

No static state. No facade calls from inside service methods.
No `env()` outside `config/events.php`. Safe as singletons on every
worker; no `flushState()` cleanup required.

## Public API

| Namespace                                                                | Purpose                                                          |
|--------------------------------------------------------------------------|------------------------------------------------------------------|
| `Academorix\Events\Attributes\OnEvent`                                   | Class-level, repeatable listener declaration.                    |
| `Academorix\Events\Attributes\ListensFor`                                | Method-level, repeatable listener declaration.                   |
| `Academorix\Events\Attributes\AfterCommit`                               | Class-level marker — fire only after DB commit.                  |
| `Academorix\Events\Attributes\Broadcastable`                             | Marks an event for broadcasting.                                 |
| `Academorix\Events\Attributes\BroadcastOn`                               | Class-level, repeatable channel declaration.                     |
| `Academorix\Events\Attributes\BroadcastAs`                               | Custom broadcast name (wire-name).                               |
| `Academorix\Events\Attributes\BroadcastQueue`                            | Custom broadcast queue.                                          |
| `Academorix\Events\Support\EventDiscovery`                               | Scanner that produces the `DiscoveryManifest`.                   |
| `Academorix\Events\Support\BroadcastConfigurator`                        | Runtime resolver for broadcasting metadata.                      |
| `Academorix\Events\Support\DiscoveryManifest`                            | Value object grouping listener bindings + broadcast metadata.    |
| `Academorix\Events\Support\ListenerBinding`                              | Value object — one resolved listener registration.               |
| `Academorix\Events\Support\BroadcastMetadata`                            | Value object — resolved broadcasting metadata for one event.     |
| `Academorix\Events\Providers\EventsServiceProvider`                      | Package entry point — extends `AbstractModuleServiceProvider`.   |

## Testing

```bash
pnpm turbo run test --filter=@academorix/events
```

Unit tests live under `tests/Unit/` and run without booting a
container. See [`docs/package-authoring.md`](../../docs/package-authoring.md)
for the shared package-authoring conventions.
