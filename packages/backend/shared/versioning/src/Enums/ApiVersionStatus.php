<?php

declare(strict_types=1);

namespace Stackra\Versioning\Enums;

use Stackra\Enum\Attributes\Description;
use Stackra\Enum\Attributes\Label;
use Stackra\Enum\Attributes\Meta;
use Stackra\Enum\Enum;

/**
 * State machine for `api_versions.status`.
 *
 * The state machine advances via the lifecycle actions
 * (`versioning:release`, `versioning:deprecate`, `versioning:sunset`)
 * and the equivalent HTTP endpoints. Backwards transitions are
 * refused with `VERSIONING_INVALID_STATE_TRANSITION`.
 *
 * ## Cases
 *
 *  * {@see self::Draft}      — under construction; not exposed on any
 *    public catalog surface.
 *  * {@see self::Released}   — public. Callers may target it.
 *  * {@see self::Deprecated} — public with warning headers. Callers
 *    should migrate before `sunset_at` fires.
 *  * {@see self::Sunset}     — retired. Requests return HTTP 410 Gone
 *    (unless `versioning.sunset.enforce_410` is off).
 *
 * @category Versioning
 *
 * @since    0.1.0
 */
#[Meta([Label::class, Description::class])]
enum ApiVersionStatus: string
{
    use Enum;

    #[Label('Draft')]
    #[Description('Under construction. Not exposed on any public catalog surface.')]
    case Draft = 'draft';

    #[Label('Released')]
    #[Description('Public. Callers may target this version.')]
    case Released = 'released';

    #[Label('Deprecated')]
    #[Description('Public with warning headers. Callers should migrate before sunset_at.')]
    case Deprecated = 'deprecated';

    #[Label('Sunset')]
    #[Description('Retired. Requests return HTTP 410 Gone.')]
    case Sunset = 'sunset';
}
