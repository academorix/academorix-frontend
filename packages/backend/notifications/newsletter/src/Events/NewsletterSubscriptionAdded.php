<?php

declare(strict_types=1);

namespace Stackra\Newsletter\Events;

use Stackra\Events\Attributes\AsEvent;
use Illuminate\Contracts\Events\ShouldDispatchAfterCommit;
use Illuminate\Foundation\Events\Dispatchable;

/**
 * Dispatched when a new subscription is persisted (pending
 * confirmation or, for admin-adds, active).
 *
 * ## Consumers
 *   - `newsletter::DispatchConfirmationEmail` — sends the double
 *     opt-in confirmation email when
 *     `requires_confirmation = true`.
 *   - `compliance::AuditListener` — writes the consent audit trail
 *     entry.
 *
 * @category Newsletter
 *
 * @since    0.1.0
 */
#[AsEvent(name: 'newsletter.subscription.added')]
final readonly class NewsletterSubscriptionAdded implements ShouldDispatchAfterCommit
{
    use Dispatchable;

    /**
     * @param  string  $subscriptionId          Subscription id.
     * @param  string  $newsletterId            Parent newsletter id.
     * @param  string  $email                   Subscriber email (normalised).
     * @param  string  $source                  How the subscription was
     *                                          created (`public`,
     *                                          `admin_added`, `imported`).
     * @param  bool    $requiresConfirmation    Whether the subscription
     *                                          needs double-opt-in.
     */
    public function __construct(
        public string $subscriptionId,
        public string $newsletterId,
        public string $email,
        public string $source,
        public bool $requiresConfirmation,
    ) {
    }
}
