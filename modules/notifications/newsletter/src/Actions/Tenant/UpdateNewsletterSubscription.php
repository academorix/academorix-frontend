<?php

declare(strict_types=1);

namespace Academorix\Newsletter\Actions\Tenant;

use Academorix\Authorization\Attributes\RequirePermission;
use Academorix\Newsletter\Contracts\Data\NewsletterSubscriptionInterface;
use Academorix\Newsletter\Contracts\Repositories\NewsletterSubscriptionRepositoryInterface;
use Academorix\Newsletter\Data\NewsletterSubscriptionData;
use Academorix\Newsletter\Data\Requests\UpdateSubscriptionRequestData;
use Academorix\Newsletter\Enums\NewsletterPermission;
use Academorix\Newsletter\Exceptions\NewsletterSubscriptionNotFoundException;
use Academorix\Routing\Attributes\AsAction;
use Academorix\Routing\Attributes\Middleware;
use Academorix\Routing\Attributes\Patch;
use Academorix\Routing\Concerns\AsController;

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
