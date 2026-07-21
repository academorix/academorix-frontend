<?php

declare(strict_types=1);

namespace Stackra\Versioning\Enums;

use Stackra\Enum\Attributes\Description;
use Stackra\Enum\Attributes\Label;
use Stackra\Enum\Attributes\Meta;
use Stackra\Enum\Enum;

/**
 * Version scheme adapter identifier persisted on `api_versions.scheme`.
 *
 * ## Cases
 *
 *  * {@see self::SemVer} — Standard SemVer. Major bump = breaking.
 *    Wildcards: `^1.0` (any 1.x), `~1.2` (any 1.2.x).
 *  * {@see self::CalVer} — Calendar versioning. Preferred for
 *    consumer-facing APIs where release cadence matches the calendar.
 *    Every release is potentially breaking.
 *
 * @category Versioning
 *
 * @since    0.1.0
 */
#[Meta([Label::class, Description::class])]
enum VersionScheme: string
{
    use Enum;

    #[Label('SemVer')]
    #[Description('Standard SemVer. Major bump = breaking. Wildcards: ^1.0 (any 1.x), ~1.2 (any 1.2.x).')]
    case SemVer = 'semver';

    #[Label('CalVer')]
    #[Description('Calendar versioning. Preferred for consumer-facing APIs where release cadence matches the calendar.')]
    case CalVer = 'calver';
}
