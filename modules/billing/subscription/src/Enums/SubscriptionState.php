<?php

declare(strict_types=1);

namespace Academorix\Subscription\Enums;

use Academorix\Enum\Attributes\Description;
use Academorix\Enum\Attributes\Label;
use Academorix\Enum\Attributes\Meta;
use Academorix\Enum\Enum;

/**
 * State machine for the `subscriptions.state` column.
 *
 * Our state extends the provider's default lifecycle with the four
 * grace-period stages named in
 * `config('subscription.dunning.stages')`.
 *
 * ## Cases
 *
 *  * {@see self::Trialing}  — inside trial window; no payment required.
 *  * {@see self::Active}    — paying + healthy.
 *  * {@see self::AtRisk}    — first payment failure (Cashier `past_due`).
 *  * {@see self::Grace}     — extended grace beyond provider default;
 *    read-only features.
 *  * {@see self::PastDue}   — Cashier's own past_due signal (kept for
 *    reconciliation traceability).
 *  * {@see self::Unpaid}    — Cashier's `unpaid` — grace expired.
 *  * {@see self::Suspended} — full feature suspension.
 *  * {@see self::Cancelled} — terminated at provider.
 *  * {@see self::Expired}   — reached expiration date (lifetime plans
 *    do not expire; monthly / annual do after cancellation).
 *
 * @category Subscription
 *
 * @since    0.1.0
 */
#[Meta([Label::class, Description::class])]
enum SubscriptionState: string
{
    use Enum;

    /**
     * Inside trial window.
     */
    #[Label('Trialing')]
    #[Description('Subscription is inside the free-trial window; no charge attempted yet.')]
    case Trialing = 'trialing';

    /**
     * Paying + healthy.
     */
    #[Label('Active')]
    #[Description('Subscription is paying and healthy.')]
    case Active = 'active';

    /**
     * First payment failure — early dunning stage.
     */
    #[Label('At Risk')]
    #[Description('First payment failure. Tenant sees a banner + email reminders.')]
    case AtRisk = 'at_risk';

    /**
     * Extended grace beyond provider default; read-only features.
     */
    #[Label('Grace')]
    #[Description('Extended grace period. Non-critical features become read-only.')]
    case Grace = 'grace';

    /**
     * Cashier `past_due` signal.
     */
    #[Label('Past Due')]
    #[Description('Payment past due at the provider. Retained for reconciliation traceability.')]
    case PastDue = 'past_due';

    /**
     * Cashier `unpaid` — grace expired.
     */
    #[Label('Unpaid')]
    #[Description('Grace expired. Provider marked the subscription unpaid.')]
    case Unpaid = 'unpaid';

    /**
     * Full feature suspension.
     */
    #[Label('Suspended')]
    #[Description('Tenant is fully suspended — login OK, everything else refused except billing pages.')]
    case Suspended = 'suspended';

    /**
     * Terminated at provider.
     */
    #[Label('Cancelled')]
    #[Description('Subscription cancelled at the provider.')]
    case Cancelled = 'cancelled';

    /**
     * Reached expiration date.
     */
    #[Label('Expired')]
    #[Description('Subscription reached its expiration date. Applies to non-renewing plans.')]
    case Expired = 'expired';

    /**
     * States considered "terminal" — no further transitions expected.
     *
     * @return list<self>
     */
    public static function terminal(): array
    {
        return [self::Cancelled, self::Expired];
    }

    /**
     * States considered "restrictive" — the tenant loses non-critical
     * features. Consumed by `subscription.active` middleware.
     *
     * @return list<self>
     */
    public static function restrictive(): array
    {
        return [self::Grace, self::Unpaid, self::Suspended, self::Cancelled, self::Expired];
    }
}
