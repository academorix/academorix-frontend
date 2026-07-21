<?php

declare(strict_types=1);

namespace Stackra\Newsletter\Actions\Central;

use Stackra\Newsletter\Contracts\Services\NewsletterServiceInterface;
use Stackra\Newsletter\Data\NewsletterSubscriptionData;
use Stackra\Routing\Attributes\AsAction;
use Stackra\Routing\Attributes\Get;
use Stackra\Routing\Attributes\Middleware;
use Stackra\Routing\Concerns\AsController;

/**
 * `GET /newsletters/{newsletter}/confirm/{token}` — public
 * confirmation endpoint.
 *
 * Validates the signed token synchronously and flips the
 * subscription to `active`. On unknown or expired tokens the
 * service throws {@see \Stackra\Newsletter\Exceptions\InvalidUnsubscribeTokenException}
 * which the framework renders as HTTP 404 (defeats enumeration).
 *
 * @category Newsletter
 *
 * @since    0.1.0
 */
#[AsAction(name: 'newsletters.public.confirm')]
#[Get('/newsletters/{newsletter}/confirm/{token}')]
#[Middleware(['api', 'throttle:newsletter-public'])]
final class ConfirmSubscription
{
    use AsController;

    public function __construct(
        private readonly NewsletterServiceInterface $service,
    ) {
    }

    public function __invoke(string $newsletter, string $token): NewsletterSubscriptionData
    {
        $subscription = $this->service->confirmSubscription($token);

        return NewsletterSubscriptionData::fromModel($subscription);
    }
}
