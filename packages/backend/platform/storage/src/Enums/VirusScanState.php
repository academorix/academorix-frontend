<?php

declare(strict_types=1);

namespace Academorix\Storage\Enums;

use Academorix\Enum\Attributes\Description;
use Academorix\Enum\Attributes\Label;
use Academorix\Enum\Attributes\Meta;
use Academorix\Enum\Enum;

/**
 * Antivirus state for a {@see \Academorix\Storage\Models\File}.
 *
 * State machine: `pending` → `scanning` → `clean` | `quarantined` | `failed`.
 * Signed URLs never issue while the state is not `clean` — the
 * `storage.antivirus.gate` middleware short-circuits reads on any
 * non-clean row.
 *
 * ## Cases
 *
 *  * {@see self::Pending}     — queued, not yet scanned.
 *  * {@see self::Scanning}    — scanner is inspecting the bytes.
 *  * {@see self::Clean}       — scanner reports no findings.
 *  * {@see self::Quarantined} — scanner found a threat; file is
 *    unreachable from every read path.
 *  * {@see self::Failed}      — scanner errored; file is treated
 *    as quarantined unless the config opts out.
 *
 * @category Storage
 *
 * @since    0.1.0
 */
#[Meta([Label::class, Description::class])]
enum VirusScanState: string
{
    use Enum;

    #[Label('Pending')]
    #[Description('Awaiting antivirus scan. Reads blocked.')]
    case Pending = 'pending';

    #[Label('Scanning')]
    #[Description('Scanner is inspecting the file. Reads blocked.')]
    case Scanning = 'scanning';

    #[Label('Clean')]
    #[Description('No threat detected. Reads allowed.')]
    case Clean = 'clean';

    #[Label('Quarantined')]
    #[Description('Scanner reported a threat. Reads refused.')]
    case Quarantined = 'quarantined';

    #[Label('Failed')]
    #[Description('Scanner errored. Treated as quarantined per config.')]
    case Failed = 'failed';
}
