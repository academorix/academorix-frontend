<?php

declare(strict_types=1);

namespace Stackra\Notifications\Push\Contracts\Repositories;

use Stackra\Crud\Contracts\RepositoryInterface;
use Stackra\Notifications\Push\Models\PushSubscription;
use Stackra\Notifications\Push\Repositories\EloquentPushSubscriptionRepository;
use DateTimeInterface;
use Illuminate\Container\Attributes\Bind;
use Illuminate\Support\Collection;

/**
 * Repository contract for {@see PushSubscription}.
 *
 * Adds the dispatch-hot-path finders on top of the base CRUD surface.
 * Consumers depend on this contract, not on the concrete
 * `EloquentPushSubscriptionRepository`.
 *
 * @extends RepositoryInterface<PushSubscription>
 *
 * @category NotificationsPush
 *
 * @since    0.1.0
 */
#[Bind(EloquentPushSubscriptionRepository::class)]
interface PushSubscriptionRepositoryInterface extends RepositoryInterface
{
    /**
     * Every active subscription for a user + application combo. The dispatch
     * hot path — used by SendPushJob to fan out one notification to every
     * device the user has registered for that application.
     *
     * @return Collection<int, PushSubscription>
     */
    public function findActiveForUserAndApplication(string $userId, string $applicationId): Collection;

    /**
     * Look up a subscription by its (user, application, token fingerprint)
     * tuple. Used by the observer's duplicate-detection path — a re-register
     * for the same token updates the existing row's `last_seen_at` instead of
     * inserting a new one.
     */
    public function findByFingerprint(string $userId, string $applicationId, string $fingerprint): ?PushSubscription;

    /**
     * Every subscription whose `last_seen_at` is older than `$cutoff` (or
     * null — never seen). Used by `PruneExpiredSubscriptionsJob`.
     *
     * @return Collection<int, PushSubscription>
     */
    public function findIdleBefore(DateTimeInterface $cutoff): Collection;

    /**
     * Every subscription owned by a user — used by the GDPR erasure path to
     * enumerate rows before purging.
     *
     * @return Collection<int, PushSubscription>
     */
    public function findByUser(string $userId): Collection;
}
