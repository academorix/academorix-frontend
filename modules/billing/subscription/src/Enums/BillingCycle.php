<?php

declare(strict_types=1);

namespace Academorix\Subscription\Enums;

use Academorix\Enum\Attributes\Description;
use Academorix\Enum\Attributes\Label;
use Academorix\Enum\Attributes\Meta;
use Academorix\Enum\Enum;

/**
 * Billing periodicity of a `Plan` row.
 *
 * @category Subscription
 *
 * @since    0.1.0
 */
#[Meta([Label::class, Description::class])]
enum BillingCycle: string
{
    use Enum;

    /**
     * Monthly renewal.
     */
    #[Label('Monthly')]
    #[Description('Renews every month.')]
    case Monthly = 'monthly';

    /**
     * Annual renewal — typically discounted vs the monthly equivalent.
     */
    #[Label('Annual')]
    #[Description('Renews every 12 months. Typically discounted vs the monthly equivalent.')]
    case Annual = 'annual';

    /**
     * One-off perpetual purchase — no renewal.
     */
    #[Label('Lifetime')]
    #[Description('One-off perpetual purchase. No renewal.')]
    case Lifetime = 'lifetime';
}
