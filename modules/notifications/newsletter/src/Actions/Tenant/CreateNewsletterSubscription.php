<?php

declare(strict_types=1);

namespace Academorix\Newsletter\Actions\Tenant;

use Academorix\Authorization\Attributes\RequirePermission;
use Academorix\Newsletter\Contracts\Data\NewsletterInterface;
use Academorix\Newsletter\Contracts\Data\NewsletterSubscriptionInterface;
use Academorix\Newsletter\Contracts\Repositories\NewsletterRepositoryInterface;
use Academorix\Newsletter\Contracts\Repositories\NewsletterSubscriptionRepositoryInterface;
use Academorix\Newsletter\Data\NewsletterSubscriptionData;
use Academorix\Newsletter\Data\Requests\AdminCreateSubscriptionRequestData;
use Academorix\Newsletter\Enums\NewsletterPermission;
use Academorix\Newsletter\Enums\NewsletterSubscriptionStatus;
use Academorix\Newsletter\Exceptions\NewsletterNotFoundException;
use Academorix\Newsletter\Services\DefaultNewsletterService;
use Academorix\Routing\Attributes\AsAction;
use Academorix\Routing\Attributes\Middleware;
use Academorix\Routing\Attributes\Post;
use Academorix\Routing\Concerns\AsController;

/**
 * `POST /api/v1/newsletters/{newsletter}/subscriptions` — admin
 * adds a subscription.
 *
 * Skips double-opt-in when the parent newsletter's
 * `confirmation_required` is `false`; otherwise the row lands
 * `pending_confirmation` and the caller can trigger a
 * confirmation email out-of-band.
 *
 * @category Newsletter
 *
 * @since    0.1.0
 */
#[AsAction(name: 'newsletter-subscriptions.create')]
#[Post('/api/v1/newsletters/{newsletter}/subscriptions')]
#[Middleware(['api', 'resolve.tenant', 'auth:sanctum', 'tenant.user'])]
#[RequirePermission(NewsletterPermission::SubscriptionsCreate)]
final class CreateNewsletterSubscription
{
    use AsController;

    public function __construct(
        private readonly NewsletterSubscriptionRepositoryInterface $subscriptions,
        private readonly NewsletterRepositoryInterface $newsletters,
    ) {
    }

    public function __invoke(string $newsletter, AdminCreateSubscriptionRequestData $data): NewsletterSubscriptionData
    {
        $parent = $this->newsletters->find($newsletter);
        if ($parent === null) {
            throw new NewsletterNotFoundException('Newsletter not found.');
        }

        $confirmationRequired = (bool) $parent->{NewsletterInterface::ATTR_CONFIRMATION_REQUIRED};
        $status = $confirmationRequired
            ? NewsletterSubscriptionStatus::PendingConfirmation
            : NewsletterSubscriptionStatus::Active;

        $subscription = $this->subscriptions->create([
            NewsletterSubscriptionInterface::ATTR_TENANT_ID           => (string) $parent->{NewsletterInterface::ATTR_TENANT_ID},
            NewsletterSubscriptionInterface::ATTR_NEWSLETTER_ID       => (string) $parent->getKey(),
            NewsletterSubscriptionInterface::ATTR_EMAIL               => $data->email,
            NewsletterSubscriptionInterface::ATTR_FIRST_NAME          => $data->firstName,
            NewsletterSubscriptionInterface::ATTR_LAST_NAME           => $data->lastName,
            NewsletterSubscriptionInterface::ATTR_LOCALE              => $data->locale,
            NewsletterSubscriptionInterface::ATTR_STATUS              => $status->value,
            NewsletterSubscriptionInterface::ATTR_SOURCE              => 'admin_added',
            NewsletterSubscriptionInterface::ATTR_TAGS                => $data->tags,
            NewsletterSubscriptionInterface::ATTR_CONFIRMATION_TOKEN  => $confirmationRequired
                ? DefaultNewsletterService::generateToken()
                : null,
            NewsletterSubscriptionInterface::ATTR_UNSUBSCRIBE_TOKEN   => DefaultNewsletterService::generateToken(),
            NewsletterSubscriptionInterface::ATTR_CONFIRMATION_EXPIRES_AT => $confirmationRequired
                ? \now()->addHours((int) \config('newsletter.tokens.confirmation_ttl_hours', 720))
                : null,
            NewsletterSubscriptionInterface::ATTR_CONFIRMED_AT        => $confirmationRequired ? null : \now(),
            NewsletterSubscriptionInterface::ATTR_SUBSCRIBED_AT       => $confirmationRequired ? null : \now(),
            NewsletterSubscriptionInterface::ATTR_CONSENT_EVIDENCE    => $data->consentEvidence,
        ]);

        return NewsletterSubscriptionData::fromModel($subscription->refresh());
    }
}
