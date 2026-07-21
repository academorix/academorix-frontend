<?php

declare(strict_types=1);

namespace Stackra\Audit\Enums;

use Stackra\Enum\Attributes\Description;
use Stackra\Enum\Attributes\Label;
use Stackra\Enum\Attributes\Meta;
use Stackra\Enum\Enum;

/**
 * Verification state for a single audit row's chain link.
 *
 * ## Cases
 *
 *  * {@see self::Pending}  — the row has been persisted but the
 *    verifier hasn't yet walked past it. `chain_verified_at` is NULL.
 *  * {@see self::Verified} — the verifier walked past this row and the
 *    stored `chain_hash` matched the recomputed hash. `chain_verified_at`
 *    carries the timestamp of the successful walk.
 *  * {@see self::Broken}   — recomputation disagreed with the stored
 *    `chain_hash`. Emits {@see \Stackra\Audit\Events\AuditChainBroken}
 *    and stops the walk.
 *
 * @category Audit
 *
 * @since    0.1.0
 */
#[Meta([Label::class, Description::class])]
enum AuditChainState: string
{
    use Enum;

    #[Label('Pending')]
    #[Description('Row persisted but not yet visited by the chain verifier.')]
    case Pending = 'pending';

    #[Label('Verified')]
    #[Description('Row verified — stored chain_hash matched recomputed hash.')]
    case Verified = 'verified';

    #[Label('Broken')]
    #[Description('Stored chain_hash disagreed with recomputed hash. Potential tampering.')]
    case Broken = 'broken';
}
