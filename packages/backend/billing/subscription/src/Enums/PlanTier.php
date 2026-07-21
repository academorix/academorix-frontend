<?php

declare(strict_types=1);

namespace Stackra\Subscription\Enums;

use Stackra\Enum\Attributes\Description;
use Stackra\Enum\Attributes\Label;
use Stackra\Enum\Attributes\Meta;
use Stackra\Enum\Enum;

/**
 * Marketing-plan tier a `Plan` row occupies.
 *
 * Drives sort ordering in the pricing UI and the swap-direction
 * inference (upgrade / downgrade / switch) in
 * {@see \Stackra\Subscription\Observers\SubscriptionObserver}.
 *
 * ## Cases
 *
 *  * {@see self::Free}       — the perpetual-free tier, if the
 *    Application offers one. `billing_mode='cashier'` with
 *    `price_micro_units=0`.
 *  * {@see self::Team}       — small-team paid tier.
 *  * {@see self::Business}   — mid-market tier.
 *  * {@see self::Enterprise} — enterprise contract; typically
 *    `billing_mode='invoice'` (offline PO).
 *  * {@see self::Custom}     — bespoke bucket for one-off tenant
 *    contracts that don't fit the standard ladder.
 *
 * @category Subscription
 *
 * @since    0.1.0
 */
#[Meta([Label::class, Description::class])]
enum PlanTier: string
{
    use Enum;

    /**
     * Free tier.
     */
    #[Label('Free')]
    #[Description('Perpetual-free tier. Price is zero; billing_mode is cashier for a smooth upgrade path.')]
    case Free = 'free';

    /**
     * Small-team paid tier.
     */
    #[Label('Team')]
    #[Description('Small-team paid tier — team seats and modest quotas.')]
    case Team = 'team';

    /**
     * Mid-market tier.
     */
    #[Label('Business')]
    #[Description('Mid-market tier — higher seat count, richer quotas.')]
    case Business = 'business';

    /**
     * Enterprise contract tier.
     */
    #[Label('Enterprise')]
    #[Description('Enterprise contract tier — typically billed via offline PO invoice.')]
    case Enterprise = 'enterprise';

    /**
     * Bespoke bucket for one-off contracts.
     */
    #[Label('Custom')]
    #[Description('Bespoke bucket for one-off tenant contracts that do not fit the standard ladder.')]
    case Custom = 'custom';

    /**
     * Sort order used to infer upgrade vs downgrade during swap.
     * Higher rank = higher tier.
     */
    public function rank(): int
    {
        return match ($this) {
            self::Free       => 0,
            self::Team       => 10,
            self::Business   => 20,
            self::Enterprise => 30,
            self::Custom     => 40,
        };
    }
}
