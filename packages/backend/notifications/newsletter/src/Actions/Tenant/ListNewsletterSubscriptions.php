<?php

declare(strict_types=1);

namespace Stackra\Newsletter\Actions\Tenant;

use Stackra\Authorization\Attributes\RequirePermission;
use Stackra\Newsletter\Contracts\Data\NewsletterSubscriptionInterface;
use Stackra\Newsletter\Contracts\Repositories\NewsletterSubscriptionRepositoryInterface;
use Stackra\Newsletter\Data\NewsletterSubscriptionData;
use Stackra\Newsletter\Enums\NewsletterPermission;
use Stackra\Newsletter\Models\NewsletterSubscription;
use Stackra\Routing\Attributes\AsAction;
use Stackra\Routing\Attributes\Get;
use Stackra\Routing\Attributes\Middleware;
use Stackra\Routing\Concerns\AsController;
use Spatie\LaravelData\DataCollection;

/**
 * `GET /api/v1/newsletters/{newsletter}/subscriptions` — list
 * subscribers, newest-first.
 *
 * @category Newsletter
 *
 * @since    0.1.0
 */
#[AsAction(name: 'newsletter-subscriptions.list')]
#[Get('/api/v1/newsletters/{newsletter}/subscriptions')]
#[Middleware(['api', 'resolve.tenant', 'auth:sanctum', 'tenant.user'])]
#[RequirePermission(NewsletterPermission::SubscriptionsViewAny)]
final class ListNewsletterSubscriptions
{
    use AsController;

    public function __construct(
        private readonly NewsletterSubscriptionRepositoryInterface $subscriptions,
    ) {
    }

    /**
     * @return DataCollection<int, NewsletterSubscriptionData>
     */
    public function __invoke(string $newsletter): DataCollection
    {
        $rows = NewsletterSubscription::query()
            ->where(NewsletterSubscriptionInterface::ATTR_NEWSLETTER_ID, $newsletter)
            ->orderByDesc(NewsletterSubscriptionInterface::ATTR_CREATED_AT)
            ->limit(200)
            ->get()
            ->map(static fn (NewsletterSubscription $s): NewsletterSubscriptionData => NewsletterSubscriptionData::fromModel($s));

        return new DataCollection(NewsletterSubscriptionData::class, $rows);
    }
}
