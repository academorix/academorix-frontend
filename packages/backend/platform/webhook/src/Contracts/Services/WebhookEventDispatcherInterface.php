<?php

declare(strict_types=1);

namespace Academorix\Webhook\Contracts\Services;

use Academorix\Webhook\Services\DefaultWebhookEventDispatcher;
use Illuminate\Container\Attributes\Bind;

/**
 * Public API for feature modules to broadcast a domain event to every
 * matching webhook subscription.
 *
 * The default implementation
 * ({@see DefaultWebhookEventDispatcher})
 * looks up active subscriptions via
 * {@see \Academorix\Webhook\Contracts\Repositories\WebhookSubscriptionRepositoryInterface::findActiveForEvent()}
 * and hands each one to the sender.
 *
 * ```php
 * $dispatcher->broadcast('invitation.sent', [
 *     'invitation_id' => $invitation->getKey(),
 *     'invitee_email' => $invitation->email,
 * ], tenantId: $invitation->tenant_id);
 * ```
 *
 * `#[Bind(DefaultWebhookEventDispatcher::class)]` — Pattern A per
 * `.kiro/steering/php-attributes.md` §"Bind vs Overrides". The
 * interface owns the wiring; the concrete stays free of the binding
 * attribute and only carries its lifetime attribute (`#[Scoped]`).
 *
 * @category Webhook
 *
 * @since    0.1.0
 */
#[Bind(DefaultWebhookEventDispatcher::class)]
interface WebhookEventDispatcherInterface
{
    /**
     * Broadcast an event to every matching subscription.
     *
     * @param  string               $eventName  Dot-separated event identifier.
     * @param  array<string, mixed> $payload    Event payload snapshot.
     * @param  string|null          $tenantId   Owning tenant — narrows the subscription list.
     * @param  string|null          $eventId    Source event ULID (idempotency key).
     */
    public function broadcast(
        string $eventName,
        array $payload,
        ?string $tenantId = null,
        ?string $eventId = null,
    ): void;
}
