<?php

declare(strict_types=1);

namespace Academorix\Newsletter\Actions\Central;

use Academorix\Newsletter\Contracts\Services\NewsletterServiceInterface;
use Academorix\Newsletter\Data\NewsletterSubscriptionData;
use Academorix\Routing\Attributes\AsAction;
use Academorix\Routing\Attributes\Middleware;
use Academorix\Routing\Attributes\Post;
use Academorix\Routing\Concerns\AsController;

/**
 * `POST /newsletters/{newsletter}/unsubscribe/{token}` — RFC 8058
 * List-Unsubscribe-Post endpoint.
 *
 * Flips the matching subscription to `unsubscribed` and fires the
 * removed event. Idempotent — a repeat POST on an already-
 * unsubscribed row returns the same DTO without re-firing.
 *
 * @category Newsletter
 *
 * @since    0.1.0
 */
#[AsAction(name: 'newsletters.public.unsubscribe.post')]
#[Post('/newsletters/{newsletter}/unsubscribe/{token}')]
#[Middleware(['api', 'throttle:newsletter-public'])]
final class UnsubscribePost
{
    use AsController;

    public function __construct(
        private readonly NewsletterServiceInterface $service,
    ) {
    }

    public function __invoke(string $newsletter, string $token): NewsletterSubscriptionData
    {
        $subscription = $this->service->unsubscribe($token);

        return NewsletterSubscriptionData::fromModel($subscription);
    }
}
