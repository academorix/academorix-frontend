<?php

declare(strict_types=1);

namespace Stackra\Compliance\Enums;

use Stackra\Enum\Attributes\Description;
use Stackra\Enum\Attributes\Label;
use Stackra\Enum\Attributes\Meta;
use Stackra\Enum\Enum;

/**
 * The GDPR action a `Dsar` row is executing.
 *
 * @category Compliance
 *
 * @since    0.1.0
 */
#[Meta([Label::class, Description::class])]
enum DsarAction: string
{
    use Enum;

    /**
     * GDPR Art. 15 (access) + Art. 20 (portability).
     */
    #[Label('Export')]
    #[Description('Right to access + portability. Deliver a bundle of every row referencing the subject.')]
    case Export = 'export';

    /**
     * GDPR Art. 17.
     */
    #[Label('Erase')]
    #[Description('Right to erasure. Delete or anonymise every row referencing the subject.')]
    case Erase = 'erase';

    /**
     * GDPR Art. 16.
     */
    #[Label('Rectify')]
    #[Description('Right to rectification. Correct inaccurate data on the subject.')]
    case Rectify = 'rectify';

    /**
     * GDPR Art. 18.
     */
    #[Label('Restrict')]
    #[Description('Right to restriction of processing. Freeze processing of the subject\'s data.')]
    case Restrict = 'restrict';
}
