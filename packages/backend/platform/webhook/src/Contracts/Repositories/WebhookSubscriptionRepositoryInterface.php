<?php

declare(strict_types=1);

namespace Stackra\Webhook\Contracts\Repositories;

use Stackra\Crud\Contracts\RepositoryInterface;
use Stackra\Webhook\Models\WebhookSubscription;
use Stackra\Webhook\Repositories\EloquentWebhookSubscriptionRepository;
use Illuminate\Container\Attributes\Bind;
use Illuminate\Support\Collection;

/**
 * Repository contract for {@see WebhookSubscription}.
 *
 * Adds the three domain finders the dispatcher + probe scheduler need
 * on top of the base CRUD surface. Consumers depend on this contract,
 * not on the concrete `EloquentWebhookSubscriptionRepository`.
 *
 * @extends RepositoryInterface<WebhookSubscription>
 *
 * @category Webhook
 *
 * @since    0.1.0
 */
#[Bind(EloquentWebhookSubscriptionRepository::class)]
interface WebhookSubscriptionRepositoryInterface extends RepositoryInterface
{
    /**
     * Every subscription owned by a tenant.
     *
     * @return Collection<int, WebhookSubscription>
     */
    public function findByTenant(string $tenantId): Collection;

    /**
     * Every active subscription that subscribes to `$eventName`.
     *
     * @return Collection<int, WebhookSubscription>
     */
    public function findActiveForEvent(string $eventName): Collection;

    /**
     * Every subscription whose `health_probe_last_at` is older than
     * `$cutoff` (or null — never probed).
     *
     * @return Collection<int, WebhookSubscription>
     */
    public function findDueForHealthProbe(\DateTimeInterface $cutoff): Collection;
}
