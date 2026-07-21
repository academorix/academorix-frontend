<?php

declare(strict_types=1);

namespace Stackra\Newsletter\Actions\Central;

use Stackra\Newsletter\Contracts\Repositories\NewsletterSubscriptionRepositoryInterface;
use Stackra\Newsletter\Data\NewsletterSubscriptionData;
use Stackra\Newsletter\Exceptions\InvalidUnsubscribeTokenException;
use Stackra\Routing\Attributes\AsAction;
use Stackra\Routing\Attributes\Get;
use Stackra\Routing\Attributes\Middleware;
use Stackra\Routing\Concerns\AsController;

/**
 * `GET /newsletters/{newsletter}/unsubscribe/{token}` — renders
 * the unsubscribe confirmation. Does NOT flip state — the caller
 * must POST to actually unsubscribe (RFC 8058 List-Unsubscribe-Post
 * ships on the sibling POST route).
 *
 * @category Newsletter
 *
 * @since    0.1.0
 */
#[AsAction(name: 'newsletters.public.unsubscribe.show')]
#[Get('/newsletters/{newsletter}/unsubscribe/{token}')]
#[Middleware(['api', 'throttle:newsletter-public'])]
final class UnsubscribeGet
{
    use AsController;

    public function __construct(
        private readonly NewsletterSubscriptionRepositoryInterface $subscriptions,
    ) {
    }

    public function __invoke(string $newsletter, string $token): NewsletterSubscriptionData
    {
        $subscription = $this->subscriptions->findByUnsubscribeToken($token);
        if ($subscription === null) {
            throw new InvalidUnsubscribeTokenException('Unsubscribe token invalid.');
        }

        return NewsletterSubscriptionData::fromModel($subscription);
    }
}
