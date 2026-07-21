<?php

declare(strict_types=1);

namespace Stackra\Compliance\Enums;

use Stackra\Enum\Attributes\Description;
use Stackra\Enum\Attributes\Label;
use Stackra\Enum\Attributes\Meta;
use Stackra\Enum\Enum;

/**
 * Scope of a `LegalHold` row — which rows the freeze applies to.
 *
 * @category Compliance
 *
 * @since    0.1.0
 */
#[Meta([Label::class, Description::class])]
enum LegalHoldScope: string
{
    use Enum;

    #[Label('Subject')]
    #[Description('Freezes retention for a single subject_id across every model.')]
    case Subject = 'subject';

    #[Label('Tenant')]
    #[Description('Freezes retention for an entire tenant.')]
    case Tenant = 'tenant';

    #[Label('Case')]
    #[Description('Freezes retention for every row tagged with a litigation case_ref.')]
    case CaseScope = 'case';

    #[Label('Class')]
    #[Description('Freezes retention for an entire model class. Rare, used for regulatory inquiries.')]
    case ClassScope = 'class';
}
