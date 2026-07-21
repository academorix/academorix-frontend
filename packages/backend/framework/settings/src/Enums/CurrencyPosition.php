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
namespace Stackra\Settings\Enums;

use Stackra\Enum\Attributes\Description;
use Stackra\Enum\Attributes\Label;
use Stackra\Enum\Enum;

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
