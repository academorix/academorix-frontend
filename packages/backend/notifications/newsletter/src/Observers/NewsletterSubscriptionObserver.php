<?php

declare(strict_types=1);

namespace Stackra\Newsletter\Observers;

use Stackra\Newsletter\Contracts\Data\NewsletterSubscriptionInterface;
use Stackra\Newsletter\Enums\NewsletterSubscriptionStatus;
use Stackra\Newsletter\Events\NewsletterSubscriptionAdded;
use Stackra\Newsletter\Events\NewsletterSubscriptionConfirmed;
use Stackra\Newsletter\Events\NewsletterSubscriptionRemoved;
use Stackra\Newsletter\Models\NewsletterSubscription;

/**
 * Observer for the {@see NewsletterSubscription} model.
 *
 * ## Hooks
 *
 *   - `creating`  — normalise email (lowercase + trim); truncate IP
 *     to /24 (GDPR minimisation); do NOT force-generate tokens here
 *     — the service that creates the row owns the token payload.
 *   - `created`   — fire {@see NewsletterSubscriptionAdded}.
 *   - `updated`   — on transition `pending_confirmation` → `active`,
 *     fire {@see NewsletterSubscriptionConfirmed}. On transition
 *     to any removal state, fire {@see NewsletterSubscriptionRemoved}.
 *
 * @category Newsletter
 *
 * @since    0.1.0
 */
final class NewsletterSubscriptionObserver
{
    /**
     * Normalise PII before insert.
     */
    public function creating(NewsletterSubscription $subscription): void
    {
        // Email — lowercase + trim.
        $email = (string) $subscription->{NewsletterSubscriptionInterface::ATTR_EMAIL};
        $subscription->{NewsletterSubscriptionInterface::ATTR_EMAIL} = \strtolower(\trim($email));

        // IP address — truncate IPv4 to /24 (GDPR minimisation).
        $ip = $subscription->{NewsletterSubscriptionInterface::ATTR_IP_ADDRESS};
        if (\is_string($ip) && $ip !== '') {
            $subscription->{NewsletterSubscriptionInterface::ATTR_IP_ADDRESS} = $this->truncateIp($ip);
        }
    }

    /**
     * Fire the added event after insert.
     */
    public function created(NewsletterSubscription $subscription): void
    {
        $status = $subscription->{NewsletterSubscriptionInterface::ATTR_STATUS};
        $requiresConfirmation = ! ($status === NewsletterSubscriptionStatus::Active
            || $status === NewsletterSubscriptionStatus::Active->value);

        NewsletterSubscriptionAdded::dispatch(
            (string) $subscription->getKey(),
            (string) $subscription->{NewsletterSubscriptionInterface::ATTR_NEWSLETTER_ID},
            (string) $subscription->{NewsletterSubscriptionInterface::ATTR_EMAIL},
            (string) $subscription->{NewsletterSubscriptionInterface::ATTR_SOURCE},
            $requiresConfirmation,
        );
    }

    /**
     * Detect state transitions and fire the matching event.
     */
    public function updated(NewsletterSubscription $subscription): void
    {
        $changed = \array_keys($subscription->getChanges());
        if (! \in_array(NewsletterSubscriptionInterface::ATTR_STATUS, $changed, true)) {
            return;
        }

        $original = $subscription->getOriginal(NewsletterSubscriptionInterface::ATTR_STATUS);
        $current  = $subscription->{NewsletterSubscriptionInterface::ATTR_STATUS};

        $originalIsPending = $original === NewsletterSubscriptionStatus::PendingConfirmation
            || $original === NewsletterSubscriptionStatus::PendingConfirmation->value;

        $currentIsActive = $current === NewsletterSubscriptionStatus::Active
            || $current === NewsletterSubscriptionStatus::Active->value;

        if ($originalIsPending && $currentIsActive) {
            $confirmedAt = $subscription->{NewsletterSubscriptionInterface::ATTR_CONFIRMED_AT} ?? \now();

            NewsletterSubscriptionConfirmed::dispatch(
                (string) $subscription->getKey(),
                $confirmedAt,
            );

            return;
        }

        // Any transition to a removal state fires the removed event.
        if ($this->isRemovalState($current)) {
            $unsubscribedAt = $subscription->{NewsletterSubscriptionInterface::ATTR_UNSUBSCRIBED_AT} ?? \now();
            $reason         = (string) ($subscription->{NewsletterSubscriptionInterface::ATTR_UNSUBSCRIBE_REASON}
                ?? $this->reasonFromStatus($current));

            NewsletterSubscriptionRemoved::dispatch(
                (string) $subscription->getKey(),
                $unsubscribedAt,
                $reason,
            );
        }
    }

    /**
     * Truncate an IPv4 address to /24 (zero the last octet).
     * IPv6 addresses are truncated to /64 (keep first four groups).
     */
    private function truncateIp(string $ip): string
    {
        if (\str_contains($ip, ':')) {
            // IPv6 — keep first 4 groups (/64).
            $groups = \explode(':', $ip);
            $keep   = \array_slice($groups, 0, 4);

            return \implode(':', $keep) . '::';
        }

        // IPv4 — zero the last octet.
        $octets = \explode('.', $ip);
        if (\count($octets) !== 4) {
            return $ip;
        }
        $octets[3] = '0';

        return \implode('.', $octets);
    }

    /**
     * @param  mixed  $status
     */
    private function isRemovalState($status): bool
    {
        $value = $status instanceof \BackedEnum ? $status->value : (string) $status;

        return \in_array($value, [
            NewsletterSubscriptionStatus::Unsubscribed->value,
            NewsletterSubscriptionStatus::Bounced->value,
            NewsletterSubscriptionStatus::Complained->value,
        ], true);
    }

    /**
     * @param  mixed  $status
     */
    private function reasonFromStatus($status): string
    {
        $value = $status instanceof \BackedEnum ? $status->value : (string) $status;

        return match ($value) {
            NewsletterSubscriptionStatus::Bounced->value    => 'bounce',
            NewsletterSubscriptionStatus::Complained->value => 'complaint',
            default                                         => 'user_action',
        };
    }
}
