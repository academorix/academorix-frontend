<?php

declare(strict_types=1);

namespace Academorix\Webhook\Services;

use Academorix\Webhook\Contracts\Data\WebhookSubscriptionInterface;
use Academorix\Webhook\Contracts\Repositories\WebhookSubscriptionRepositoryInterface;
use Academorix\Webhook\Contracts\Services\WebhookEventDispatcherInterface;
use Academorix\Webhook\Contracts\Services\WebhookSenderInterface;
use Academorix\Webhook\Models\WebhookSubscription;
use Illuminate\Container\Attributes\Scoped;

/**
 * Default {@see WebhookEventDispatcherInterface} implementation.
 *
 * Fans out an event to every active subscription that opted in.
 * Optionally narrows by `tenant_id` when the caller passes one (the
 * common case — every event is tenant-scoped). Errors are isolated
 * per-subscription: a broken destination cannot break siblings.
 *
 * `#[Scoped]` — resolves scoped state via the sender. The interface
 * declares the container binding via
 * `#[Bind(DefaultWebhookEventDispatcher::class)]` (Pattern A per
 * `.kiro/steering/php-attributes.md`), so this concrete carries only
 * its lifetime attribute.
 *
 * @category Webhook
 *
 * @since    0.1.0
 */
#[Scoped]
final class DefaultWebhookEventDispatcher implements WebhookEventDispatcherInterface
{
    public function __construct(
        private readonly WebhookSubscriptionRepositoryInterface $subscriptions,
        private readonly WebhookSenderInterface $sender,
    ) {
    }

    /**
     * {@inheritDoc}
     */
    public function broadcast(
        string $eventName,
        array $payload,
        ?string $tenantId = null,
        ?string $eventId = null,
    ): void {
        $candidates = $this->subscriptions->findActiveForEvent($eventName);

        if ($tenantId !== null) {
            $candidates = $candidates->filter(
                static fn (WebhookSubscription $s): bool =>
                    (string) $s->{WebhookSubscriptionInterface::ATTR_TENANT_ID} === $tenantId,
            );
        }

        foreach ($candidates as $subscription) {
            try {
                $this->sender->send($subscription, $eventName, $payload, $eventId);
            } catch (\Throwable $e) {
                // Per-subscription isolation — a broken destination
                // must not break siblings in the fan-out. The sender
                // records failure on the delivery row it created; the
                // dispatcher's job is just to walk the list.
                \report($e);
            }
        }
    }
}
