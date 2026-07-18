<?php

declare(strict_types=1);

namespace Academorix\Subscription\Enums;

use Academorix\Enum\Attributes\Description;
use Academorix\Enum\Attributes\Label;
use Academorix\Enum\Attributes\Meta;
use Academorix\Enum\Enum;

/**
 * How a `Plan` is billed at the payment provider.
 *
 *  * {@see self::Cashier} — routes through Laravel Cashier
 *    (Stripe / Paddle) — the default.
 *  * {@see self::Invoice} — offline PO billing. No Cashier row is
 *    created; renewal is manual + confirmed by platform admin.
 *
 * @category Subscription
 *
 * @since    0.1.0
 */
#[Meta([Label::class, Description::class])]
enum BillingMode: string
{
    use Enum;

    /**
     * Provider-native billing via Cashier.
     */
    #[Label('Cashier')]
    #[Description('Provider-native billing via Cashier (Stripe / Paddle).')]
    case Cashier = 'cashier';

    /**
     * Offline PO billing. No Cashier row created.
     */
    #[Label('Invoice')]
    #[Description('Offline purchase-order billing. No Cashier row created; renewal is manual.')]
    case Invoice = 'invoice';
}
