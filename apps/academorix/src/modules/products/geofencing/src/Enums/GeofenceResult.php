<?php

declare(strict_types=1);

namespace Academorix\Geofencing\Enums;

use Stackra\Enum\Attributes\Description;
use Stackra\Enum\Attributes\Label;
use Stackra\Enum\Attributes\Meta;
use Stackra\Enum\Enum;

/**
 * Outcome of one geofence evaluation.
 *
 * ## Cases
 *
 *  * {@see self::Inside}  — inside the fence / within radius.
 *  * {@see self::Outside} — outside. Consumer blocks unless override applied.
 *  * {@see self::Skipped} — accuracy exceeded tolerance; no verdict.
 *  * {@see self::Error}   — evaluation could not run. Fail-closed.
 *
 * Uppercase backing values match the wire contract R3. Consumers derive
 * whether to BLOCK from {@see isBlocking()}.
 *
 * @category Geofencing
 *
 * @since    0.1.0
 */
#[Meta([Label::class, Description::class])]
enum GeofenceResult: string
{
    use Enum;

    #[Label('Inside')]
    #[Description('Reported location is inside the fence or within the radius.')]
    case Inside = 'INSIDE';

    #[Label('Outside')]
    #[Description('Reported location is outside the fence. Blocks unless overridden.')]
    case Outside = 'OUTSIDE';

    #[Label('Skipped')]
    #[Description('Accuracy exceeded tolerance — evaluator declined to give a verdict.')]
    case Skipped = 'SKIPPED';

    #[Label('Error')]
    #[Description('Evaluation could not run to completion. Fail-closed — treated as blocking.')]
    case Error = 'ERROR';

    /**
     * Whether the result should block the caller (fail-closed for
     * enforcement contexts).
     */
    public function isBlocking(): bool
    {
        return match ($this) {
            self::Outside, self::Error => true,
            self::Inside, self::Skipped => false,
        };
    }
}
