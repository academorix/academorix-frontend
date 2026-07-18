<?php

declare(strict_types=1);

namespace Academorix\Newsletter\Actions\Tenant;

use Academorix\Authorization\Attributes\RequirePermission;
use Academorix\Newsletter\Contracts\Repositories\NewsletterSubscriptionRepositoryInterface;
use Academorix\Newsletter\Enums\NewsletterPermission;
use Academorix\Newsletter\Exceptions\NewsletterSubscriptionNotFoundException;
use Academorix\Routing\Attributes\AsAction;
use Academorix\Routing\Attributes\Delete;
use Academorix\Routing\Attributes\Middleware;
use Academorix\Routing\Concerns\AsController;
use Illuminate\Http\JsonResponse;

/**
 * `DELETE /api/v1/newsletters/{newsletter}/subscriptions/{subscription}`
 * — soft-delete a subscription record.
 *
 * @category Newsletter
 *
 * @since    0.1.0
 */
#[AsAction(name: 'newsletter-subscriptions.delete')]
#[Delete('/api/v1/newsletters/{newsletter}/subscriptions/{subscription}')]
#[Middleware(['api', 'resolve.tenant', 'auth:sanctum', 'tenant.user'])]
#[RequirePermission(NewsletterPermission::SubscriptionsDelete)]
final class DeleteNewsletterSubscription
{
    use AsController;

    public function __construct(
        private readonly NewsletterSubscriptionRepositoryInterface $subscriptions,
    ) {
    }

    public function __invoke(string $newsletter, string $subscription): JsonResponse
    {
        $model = $this->subscriptions->find($subscription);
        if ($model === null) {
            throw new NewsletterSubscriptionNotFoundException('Subscription not found.');
        }

        $model->delete();

        return response()->json(null, JsonResponse::HTTP_NO_CONTENT);
    }
}
