<?php

declare(strict_types=1);

namespace Stackra\Newsletter\Actions\Central;

use Stackra\Newsletter\Contracts\Services\NewsletterServiceInterface;
use Stackra\Newsletter\Data\NewsletterSubscriptionData;
use Stackra\Routing\Attributes\AsAction;
use Stackra\Routing\Attributes\Middleware;
use Stackra\Routing\Attributes\Post;
use Stackra\Routing\Concerns\AsController;

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
