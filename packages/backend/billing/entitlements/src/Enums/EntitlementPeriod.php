<?php

declare(strict_types=1);

namespace Stackra\Entitlements\Enums;

use Stackra\Enum\Attributes\Description;
use Stackra\Enum\Attributes\Label;
use Stackra\Enum\Attributes\Meta;
use Stackra\Enum\Enum;

/**
 * Reset window for a `pool`-kind entitlement.
 *
 * ## Cases
 *
 *  * {@see self::Monthly}     — resets at the first of each calendar
 *    month in the configured `month_boundary_timezone`.
 *  * {@see self::Anniversary} — resets on the tenant's subscription
 *    anniversary date (billing cycle boundary).
 *  * {@see self::Lifetime}    — never resets. `used` accumulates for
 *    the lifetime of the entitlement (typical for total-spend caps).
 *
 * @category Entitlements
 *
 * @since    0.1.0
 */
#[Meta([Label::class, Description::class])]
enum EntitlementPeriod: string
{
    use Enum;

    /**
     * Calendar-month reset.
     */
    #[Label('Monthly')]
    #[Description('Resets at the first of every calendar month in the configured timezone.')]
    case Monthly = 'monthly';

    /**
     * Subscription-anniversary reset — matches the billing cycle.
     */
    #[Label('Anniversary')]
    #[Description('Resets on the tenant\'s subscription anniversary date. Matches the billing cycle.')]
    case Anniversary = 'anniversary';

    /**
     * Never resets — accumulates for the entitlement lifetime.
     */
    #[Label('Lifetime')]
    #[Description('Never resets — usage accumulates for the lifetime of the entitlement.')]
    case Lifetime = 'lifetime';
}
