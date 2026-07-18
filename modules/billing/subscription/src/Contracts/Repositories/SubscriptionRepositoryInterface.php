<?php

declare(strict_types=1);

namespace Academorix\Subscription\Contracts\Repositories;

use Academorix\Crud\Contracts\RepositoryInterface;
use Academorix\Subscription\Models\Subscription;
use Academorix\Subscription\Repositories\EloquentSubscriptionRepository;
use DateTimeInterface;
use Illuminate\Container\Attributes\Bind;
use Illuminate\Support\Collection;

/**
 * Repository contract for {@see Subscription}.
 *
 * Domain finders needed by the dunning orchestrator, trial expirer,
 * and reconciliation job on top of the base CRUD surface. Consumers
 * depend on this contract, not on the concrete
 * `EloquentSubscriptionRepository`.
 *
 * @extends RepositoryInterface<Subscription>
 *
 * @category Subscription
 *
 * @since    0.1.0
 */
#[Bind(EloquentSubscriptionRepository::class)]
interface SubscriptionRepositoryInterface extends RepositoryInterface
{
    /**
     * The tenant's active subscription (non-terminal state). Returns
     * null when the tenant has never subscribed or the subscription
     * has cancelled / expired.
     *
     * @param  string  $tenantId  Owning tenant.
     */
    public function findActiveForTenant(string $tenantId): ?Subscription;

    /**
     * Find one subscription by the payment provider's own id
     * (Cashier's `stripe_id` / `paddle_id`). Used by the webhook
     * consumer during idempotency + state translation.
     */
    public function findByProviderSubscriptionId(string $providerSubscriptionId): ?Subscription;

    /**
     * Subscriptions inside the dunning progression whose
     * `grace_ends_at` has passed. Consumed by
     * `AdvanceDunningStageJob`.
     *
     * @return Collection<int, Subscription>
     */
    public function findDueForDunningAdvance(DateTimeInterface $now): Collection;

    /**
     * Trialing subscriptions whose `trial_ends_at` falls inside the
     * warning window. Consumed by `ExpireTrialsJob` to fire
     * `TrialEnding` notifications.
     *
     * @return Collection<int, Subscription>
     */
    public function findTrialsEndingBetween(DateTimeInterface $from, DateTimeInterface $to): Collection;

    /**
     * Trialing subscriptions whose `trial_ends_at` has passed.
     * Consumed by `ExpireTrialsJob` to transition trials to active or
     * cancelled based on whether a payment method is attached.
     *
     * @return Collection<int, Subscription>
     */
    public function findTrialsExpiredBefore(DateTimeInterface $cutoff): Collection;
}
