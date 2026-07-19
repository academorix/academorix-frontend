<?php

declare(strict_types=1);

namespace Academorix\Newsletter\Contracts\Repositories;

use Academorix\Crud\Contracts\RepositoryInterface;
use Academorix\Newsletter\Models\NewsletterSubscription;
use Academorix\Newsletter\Repositories\EloquentNewsletterSubscriptionRepository;
use DateTimeInterface;
use Illuminate\Container\Attributes\Bind;
use Illuminate\Support\Collection;

/**
 * Repository contract for {@see NewsletterSubscription}.
 *
 * Adds the confirmation / unsubscribe token lookups + engagement
 * finders + prune queries on top of the base CRUD surface.
 *
 * @extends RepositoryInterface<NewsletterSubscription>
 *
 * @category Newsletter
 *
 * @since    0.1.0
 */
#[Bind(EloquentNewsletterSubscriptionRepository::class)]
interface NewsletterSubscriptionRepositoryInterface extends RepositoryInterface
{
    /**
     * Find a subscription by newsletter + normalised email pair, or
     * `null` when none matches. Email is lowered + trimmed before the
     * lookup so `Foo@BAR.com` and `foo@bar.com` collide as one row.
     */
    public function findByEmail(string $newsletterId, string $email): ?NewsletterSubscription;

    /**
     * Find a subscription by its signed confirmation token. Returns
     * `null` on unknown token (the caller returns 404 to defeat
     * enumeration).
     */
    public function findByConfirmationToken(string $token): ?NewsletterSubscription;

    /**
     * Find a subscription by its signed unsubscribe token.
     */
    public function findByUnsubscribeToken(string $token): ?NewsletterSubscription;

    /**
     * Active subscriptions matching a specific tag. Used by audience
     * expression evaluators.
     *
     * @return Collection<int, NewsletterSubscription>
     */
    public function findActiveWithTag(string $newsletterId, string $tag): Collection;

    /**
     * Every active subscription for a newsletter. Returns a lazy
     * collection to keep memory bounded for large audiences.
     *
     * @return Collection<int, NewsletterSubscription>
     */
    public function findAllActive(string $newsletterId): Collection;

    /**
     * Every subscription in `pending_confirmation` whose
     * `confirmation_expires_at` is at or before `$cutoff`. Consumed
     * by {@see \Academorix\Newsletter\Jobs\PruneUnengagedSubscribersJob}.
     *
     * @return Collection<int, NewsletterSubscription>
     */
    public function findExpiredPending(string $newsletterId, DateTimeInterface $cutoff): Collection;
}
