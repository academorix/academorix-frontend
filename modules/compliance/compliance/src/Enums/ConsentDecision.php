<?php

declare(strict_types=1);

namespace Academorix\Compliance\Enums;

use Academorix\Enum\Attributes\Description;
use Academorix\Enum\Attributes\Label;
use Academorix\Enum\Attributes\Meta;
use Academorix\Enum\Enum;

/**
 * The decision recorded on a `ConsentRecord` row.
 *
 * Consent is immutable — withdrawal writes a NEW row, never mutates
 * the previous grant.
 *
 * @category Compliance
 *
 * @since    0.1.0
 */
#[Meta([Label::class, Description::class])]
enum ConsentDecision: string
{
    use Enum;

    #[Label('Granted')]
    #[Description('The subject granted consent for this category.')]
    case Granted = 'granted';

    #[Label('Withdrawn')]
    #[Description('The subject withdrew a previously-granted consent.')]
    case Withdrawn = 'withdrawn';
}
