<?php

declare(strict_types=1);

/**
 * Billing Provider Enumeration
 *
 * Defines the set of allowed values for Billing Provider within the Settings module.
 * Supported values include: Stripe, Paddle, None.
 *
 * @category Enums
 *
 * @since    1.0.0
 */
namespace Academorix\Settings\Enums;

use Academorix\Enum\Attributes\Description;
use Academorix\Enum\Attributes\Label;
use Academorix\Enum\Enum;

/** Supported billing/payment providers. */
enum BillingProvider: string
{
    use Enum;

    #[Label('Stripe')]
    #[Description('Stripe payment processing platform.')]
    case Stripe = 'stripe';

    #[Label('Paddle')]
    #[Description('Paddle merchant of record billing platform.')]
    case Paddle = 'paddle';

    #[Label('None')]
    #[Description('No billing provider configured.')]
    case None = 'none';
}
