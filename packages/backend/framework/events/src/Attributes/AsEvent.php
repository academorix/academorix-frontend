<?php

/**
 * @file packages/framework/events/src/Attributes/AsEvent.php
 *
 * @description
 * Class-level marker attribute that identifies a class as a
 * domain event. Discovered at composer-dump time via
 * `olvlvl/composer-attribute-collector` and consumed by:
 *
 *   - The event catalog generator (planned) — emits a
 *     machine-readable list of every event the app can fire,
 *     for dashboards and documentation.
 *   - Static analysis + PHPStan rules that verify events carry
 *     a `@description` docblock, immutable (`readonly`)
 *     properties, and no side effects in the constructor.
 *
 * ## Purpose (ADR 0010)
 *
 * Every domain event carries this marker + a class-level
 * docblock explaining the semantic meaning of the event
 * (what happened, who triggered it, what state changed). The
 * marker + docblock together form the "wire contract" other
 * teams reason about — an event's rename, addition, or removal
 * needs to appear in the catalog + CHANGELOG.
 *
 * ## What it is NOT
 *
 *   - It is not `#[OnEvent]` — that's a LISTENER attribute
 *     bound to a class that RESPONDS to events.
 *   - It is not `#[Broadcastable]` — that's a broadcasting
 *     enabler.
 *
 * ## Usage
 *
 * ```php
 * use Academorix\Events\Attributes\AsEvent;
 *
 * /**
 *  * @description
 *  * Fired when a tenant transitions from Trialing → Active.
 *  * Consumers: BillingModule (activates subscription),
 *  * NotificationsModule (sends welcome email).
 *  *\/
 * #[AsEvent(name: 'tenancy.tenant.activated')]
 * final readonly class TenantActivated
 * {
 *     public function __construct(
 *         public string $tenantId,
 *         public CarbonImmutable $activatedAt,
 *     ) {}
 * }
 * ```
 *
 * ## Naming convention
 *
 * `{domain}.{aggregate}.{past-participle}` — dotted, lowercase,
 * verb in past-tense. Matches the convention used across
 * Kafka topics, webhooks, and audit-log entries so the same
 * name flows through every layer.
 *
 * @see \Academorix\Events\Attributes\OnEvent Listener counterpart.
 * @see \Academorix\Events\Support\EventDiscovery Discovery target.
 */

declare(strict_types=1);

namespace Academorix\Events\Attributes;

use Attribute;

/**
 * Marker attribute for domain event classes.
 *
 * `TARGET_CLASS` because events are always classes; not
 * `IS_REPEATABLE` because one class = one event.
 */
#[Attribute(Attribute::TARGET_CLASS)]
final readonly class AsEvent
{
    /**
     * @param  string|null  $name
     *   Public dotted name (e.g. `tenancy.tenant.activated`). When
     *   null, downstream tooling derives it from the class FQCN.
     *
     * @param  bool  $broadcasted
     *   Hint that this event is also broadcast to WebSocket /
     *   Ably / Pusher subscribers. Purely informational — the
     *   actual broadcast wiring lives on
     *   {@see \Academorix\Events\Attributes\Broadcastable}.
     */
    public function __construct(
        public ?string $name = null,
        public bool $broadcasted = false,
    ) {
    }
}
