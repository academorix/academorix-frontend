<?php

declare(strict_types=1);

namespace Academorix\Newsletter\Actions\Central;

use Academorix\Newsletter\Contracts\Data\NewsletterInterface;
use Academorix\Newsletter\Contracts\Data\NewsletterSubscriptionInterface;
use Academorix\Newsletter\Contracts\Repositories\NewsletterRepositoryInterface;
use Academorix\Newsletter\Contracts\Repositories\NewsletterSubscriptionRepositoryInterface;
use Academorix\Newsletter\Data\NewsletterSubscriptionData;
use Academorix\Newsletter\Data\Requests\SubscribeNewsletterRequestData;
use Academorix\Newsletter\Enums\NewsletterSubscriptionStatus;
use Academorix\Newsletter\Exceptions\NewsletterNotFoundException;
use Academorix\Newsletter\Services\DefaultNewsletterService;
use Academorix\Routing\Attributes\AsAction;
use Academorix\Routing\Attributes\Middleware;
use Academorix\Routing\Attributes\Post;
use Academorix\Routing\Concerns\AsController;
use Illuminate\Http\Request;

/**
 * `POST /newsletters/{newsletter}/subscribe` — public subscribe
 * endpoint. No auth. Rate-limited.
 *
 * Creates a `pending_confirmation` subscription with a signed
 * confirmation token. The observer normalises email + truncates IP
 * to /24; consent evidence is captured from the request.
 *
 * @category Newsletter
 *
 * @since    0.1.0
 */
#[AsAction(name: 'newsletters.public.subscribe')]
#[Post('/newsletters/{newsletter}/subscribe')]
#[Middleware(['api', 'throttle:newsletter-public'])]
final class SubscribeNewsletter
{
    use AsController;

    public function __construct(
        private readonly NewsletterRepositoryInterface $newsletters,
        private readonly NewsletterSubscriptionRepositoryInterface $subscriptions,
    ) {
    }

    public function __invoke(
        string $newsletter,
        SubscribeNewsletterRequestData $data,
        Request $request,
    ): NewsletterSubscriptionData {
        $parent = $this->newsletters->findBySlug(
            (string) $request->attributes->get('tenant_id', ''),
            $newsletter,
        ) ?? $this->newsletters->find($newsletter);

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
            NewsletterSubscriptionInterface::ATTR_SOURCE              => 'public',
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
            NewsletterSubscriptionInterface::ATTR_CONSENT_EVIDENCE    => [
                'form_url'           => (string) $request->fullUrl(),
                'consent_text_hash'  => \hash('sha256', 'newsletter subscribe form'),
                'captured_at'        => \now()->toIso8601String(),
            ],
            NewsletterSubscriptionInterface::ATTR_IP_ADDRESS          => $request->ip(),
            NewsletterSubscriptionInterface::ATTR_USER_AGENT          => (string) $request->userAgent(),
        ]);

        return NewsletterSubscriptionData::fromModel($subscription->refresh());
    }
}
