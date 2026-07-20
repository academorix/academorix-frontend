<?php

declare(strict_types=1);

/**
 * Currency Position Enumeration
 *
 * Defines the set of allowed values for Currency Position within the Settings module.
 * Supported values include: Before, After.
 *
 * @category Enums
 *
 * @since    1.0.0
 */
namespace Academorix\Settings\Enums;

use Academorix\Enum\Attributes\Description;
use Academorix\Enum\Attributes\Label;
use Academorix\Enum\Enum;

/** Currency symbol position relative to the amount. */
enum CurrencyPosition: string
{
    use Enum;

    #[Label('Before Amount')]
    #[Description('Places the currency symbol before the amount (e.g. $100).')]
    case Before = 'before';

    #[Label('After Amount')]
    #[Description('Places the currency symbol after the amount (e.g. 100€).')]
    case After = 'after';
}
