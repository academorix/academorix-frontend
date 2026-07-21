<?php

declare(strict_types=1);

namespace Stackra\Compliance\Enums;

use Stackra\Enum\Attributes\Description;
use Stackra\Enum\Attributes\Label;
use Stackra\Enum\Attributes\Meta;
use Stackra\Enum\Enum;

/**
 * State machine for a `Dsar` row.
 *
 * `received` → `triaging` → `collecting` → `assembling` → `delivered`.
 * Any state can transition to `rejected` when the platform admin
 * refuses the request (missing identity verification, invalid
 * subject, etc).
 *
 * @category Compliance
 *
 * @since    0.1.0
 */
#[Meta([Label::class, Description::class])]
enum DsarState: string
{
    use Enum;

    #[Label('Received')]
    #[Description('New request lodged; awaiting platform-admin triage.')]
    case Received = 'received';

    #[Label('Triaging')]
    #[Description('Platform admin is verifying the subject identity and DSAR scope.')]
    case Triaging = 'triaging';

    #[Label('Collecting')]
    #[Description('Contributing modules are producing artefacts.')]
    case Collecting = 'collecting';

    #[Label('Assembling')]
    #[Description('Artefacts are being packed into a single bundle.')]
    case Assembling = 'assembling';

    #[Label('Delivered')]
    #[Description('Bundle delivered to the subject via a signed URL.')]
    case Delivered = 'delivered';

    #[Label('Rejected')]
    #[Description('Request refused. `reason` explains why.')]
    case Rejected = 'rejected';

    /**
     * States considered terminal — no further transitions.
     *
     * @return list<self>
     */
    public static function terminal(): array
    {
        return [self::Delivered, self::Rejected];
    }
}
