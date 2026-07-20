<?php

declare(strict_types=1);

namespace Academorix\Compliance\Enums;

use Academorix\Enum\Attributes\Description;
use Academorix\Enum\Attributes\Label;
use Academorix\Enum\Attributes\Meta;
use Academorix\Enum\Enum;

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
