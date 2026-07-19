<?php

declare(strict_types=1);

namespace Academorix\Notifications\Enums;

use Academorix\Enum\Attributes\Description;
use Academorix\Enum\Attributes\Label;
use Academorix\Enum\Attributes\Meta;
use Academorix\Enum\Enum;

/**
 * Consent tier for a notification category.
 *
 * Determines whether a recipient can opt out of the category.
 * Transactional-required categories (security alerts, MFA challenges,
 * legal notices) cannot be opted out of by law and by product design.
 *
 * ## Cases
 *
 *  * {@see self::TransactionalRequired} — cannot be opted out.
 *  * {@see self::ProductOptOut}          — on by default; opt-out allowed.
 *  * {@see self::MarketingOptIn}         — off by default; opt-in required.
 *
 * @category Notifications
 *
 * @since    0.1.0
 */
#[Meta([Label::class, Description::class])]
enum ConsentTier: string
{
    use Enum;

    #[Label('Transactional (required)')]
    #[Description('Cannot be opted out. Security, legal, and life-safety notifications.')]
    case TransactionalRequired = 'transactional_required';

    #[Label('Product (opt-out)')]
    #[Description('On by default. Recipient may opt out at any time.')]
    case ProductOptOut = 'product_opt_out';

    #[Label('Marketing (opt-in)')]
    #[Description('Off by default. Recipient must explicitly opt in.')]
    case MarketingOptIn = 'marketing_opt_in';
}
