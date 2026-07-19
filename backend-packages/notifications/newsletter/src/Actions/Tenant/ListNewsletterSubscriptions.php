<?php

declare(strict_types=1);

namespace Academorix\Newsletter\Actions\Tenant;

use Academorix\Authorization\Attributes\RequirePermission;
use Academorix\Newsletter\Contracts\Data\NewsletterSubscriptionInterface;
use Academorix\Newsletter\Contracts\Repositories\NewsletterSubscriptionRepositoryInterface;
use Academorix\Newsletter\Data\NewsletterSubscriptionData;
use Academorix\Newsletter\Enums\NewsletterPermission;
use Academorix\Newsletter\Models\NewsletterSubscription;
use Academorix\Routing\Attributes\AsAction;
use Academorix\Routing\Attributes\Get;
use Academorix\Routing\Attributes\Middleware;
use Academorix\Routing\Concerns\AsController;
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
