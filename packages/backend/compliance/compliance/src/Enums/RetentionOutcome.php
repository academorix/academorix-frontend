<?php

declare(strict_types=1);

namespace Stackra\Compliance\Enums;

use Stackra\Enum\Attributes\Description;
use Stackra\Enum\Attributes\Label;
use Stackra\Enum\Attributes\Meta;
use Stackra\Enum\Enum;

/**
 * Outcome of a retention-run row per model class.
 *
 * @category Compliance
 *
 * @since    0.1.0
 */
#[Meta([Label::class, Description::class])]
enum RetentionOutcome: string
{
    use Enum;

    #[Label('Purged')]
    #[Description('Row was hard-deleted.')]
    case Purged = 'purged';

    #[Label('Anonymized')]
    #[Description('Subject-identifying columns hashed to a stable pseudonym.')]
    case Anonymized = 'anonymized';

    #[Label('Archived')]
    #[Description('Row soft-deleted via deleted_at.')]
    case Archived = 'archived';

    #[Label('Held')]
    #[Description('Skipped due to an active LegalHold.')]
    case Held = 'held';

    #[Label('Skipped by Policy')]
    #[Description('Per-module rule refused the purge.')]
    case SkippedPolicy = 'skipped_policy';

    #[Label('Failed')]
    #[Description('Job error; the sweep will retry on the next run.')]
    case Failed = 'failed';
}
