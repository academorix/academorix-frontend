<?php

declare(strict_types=1);

namespace Academorix\Newsletter\Actions\Central;

use Academorix\Newsletter\Contracts\Repositories\NewsletterSubscriptionRepositoryInterface;
use Academorix\Newsletter\Data\NewsletterSubscriptionData;
use Academorix\Newsletter\Exceptions\InvalidUnsubscribeTokenException;
use Academorix\Routing\Attributes\AsAction;
use Academorix\Routing\Attributes\Get;
use Academorix\Routing\Attributes\Middleware;
use Academorix\Routing\Concerns\AsController;

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
