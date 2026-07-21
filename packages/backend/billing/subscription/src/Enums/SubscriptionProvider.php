<?php

declare(strict_types=1);

namespace Stackra\Subscription\Enums;

use Stackra\Enum\Attributes\Description;
use Stackra\Enum\Attributes\Label;
use Stackra\Enum\Attributes\Meta;
use Stackra\Enum\Enum;

/**
 * Payment provider fronting a subscription. Denormalised from the
 * Application at creation and stored on the subscription row for
 * fast filtering.
 *
 * @category Subscription
 *
 * @since    0.1.0
 */
#[Meta([Label::class, Description::class])]
enum SubscriptionProvider: string
{
    use Enum;

    /**
     * Stripe (Cashier's default variant).
     */
    #[Label('Stripe')]
    #[Description('Stripe payment provider — Cashier default variant.')]
    case Stripe = 'stripe';

    /**
     * Paddle — Merchant of Record model.
     */
    #[Label('Paddle')]
    #[Description('Paddle payment provider — Merchant of Record model. Handles VAT / sales tax.')]
    case Paddle = 'paddle';

    /**
     * Offline invoice — Cashier bypassed.
     */
    #[Label('Invoice')]
    #[Description('Offline PO invoice — Cashier is bypassed; renewals are manual.')]
    case Invoice = 'invoice';
}
