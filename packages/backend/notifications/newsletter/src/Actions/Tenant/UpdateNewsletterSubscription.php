<?php

declare(strict_types=1);

namespace Stackra\Newsletter\Actions\Tenant;

use Stackra\Authorization\Attributes\RequirePermission;
use Stackra\Newsletter\Contracts\Data\NewsletterSubscriptionInterface;
use Stackra\Newsletter\Contracts\Repositories\NewsletterSubscriptionRepositoryInterface;
use Stackra\Newsletter\Data\NewsletterSubscriptionData;
use Stackra\Newsletter\Data\Requests\UpdateSubscriptionRequestData;
use Stackra\Newsletter\Enums\NewsletterPermission;
use Stackra\Newsletter\Exceptions\NewsletterSubscriptionNotFoundException;
use Stackra\Routing\Attributes\AsAction;
use Stackra\Routing\Attributes\Middleware;
use Stackra\Routing\Attributes\Patch;
use Stackra\Routing\Concerns\AsController;

/**
 * `PATCH /api/v1/newsletters/{newsletter}/subscriptions/{subscription}`
 * — update tags / name / locale only. `email` and consent evidence
 * are NEVER editable (protecting the consent audit trail).
 *
 * @category Newsletter
 *
 * @since    0.1.0
 */
#[AsAction(name: 'newsletter-subscriptions.update')]
#[Patch('/api/v1/newsletters/{newsletter}/subscriptions/{subscription}')]
#[Middleware(['api', 'resolve.tenant', 'auth:sanctum', 'tenant.user'])]
#[RequirePermission(NewsletterPermission::SubscriptionsUpdate)]
final class UpdateNewsletterSubscription
{
    use AsController;

    public function __construct(
        private readonly NewsletterSubscriptionRepositoryInterface $subscriptions,
    ) {
    }

    public function __invoke(
        string $newsletter,
        string $subscription,
        UpdateSubscriptionRequestData $data,
    ): NewsletterSubscriptionData {
        $model = $this->subscriptions->find($subscription);
        if ($model === null) {
            throw new NewsletterSubscriptionNotFoundException('Subscription not found.');
        }

        $updates = [];
        if ($data->firstName !== null) {
            $updates[NewsletterSubscriptionInterface::ATTR_FIRST_NAME] = $data->firstName;
        }
        if ($data->lastName !== null) {
            $updates[NewsletterSubscriptionInterface::ATTR_LAST_NAME] = $data->lastName;
        }
        if ($data->locale !== null) {
            $updates[NewsletterSubscriptionInterface::ATTR_LOCALE] = $data->locale;
        }
        if ($data->tags !== null) {
            $updates[NewsletterSubscriptionInterface::ATTR_TAGS] = $data->tags;
        }

        if ($updates !== []) {
            $model->update($updates);
        }

        return NewsletterSubscriptionData::fromModel($model->refresh());
    }
}
