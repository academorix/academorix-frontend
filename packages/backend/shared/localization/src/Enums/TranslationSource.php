<?php

declare(strict_types=1);

namespace Stackra\Localization\Enums;

use Stackra\Enum\Attributes\Description;
use Stackra\Enum\Attributes\Label;
use Stackra\Enum\Attributes\Meta;
use Stackra\Enum\Enum;

/**
 * How a `Translation` row was produced.
 *
 * Drives per-source retention, drives whether the row is eligible
 * for the `verified_at` review path, and drives the UI badge next to
 * each row in the tenant translation manager.
 *
 * ## Cases
 *
 *  * {@see self::Manual} — hand-authored by a tenant admin or reviewer.
 *  * {@see self::Machine} — produced by a translator driver (OpenAI,
 *    Google, DeepL, AWS Translate, Azure, Null).
 *  * {@see self::Import} — bulk-imported from a `lang/*` file at seed
 *    time or via `localization:reconcile-cache`.
 *
 * @category Localization
 *
 * @since    0.1.0
 */
#[Meta([Label::class, Description::class])]
enum TranslationSource: string
{
    use Enum;

    /**
     * Hand-authored by a tenant admin or reviewer.
     */
    #[Label('Manual')]
    #[Description('Hand-authored by a tenant admin or translation reviewer.')]
    case Manual = 'manual';

    /**
     * Produced by a machine translator driver.
     */
    #[Label('Machine')]
    #[Description('Produced by a machine-translation driver (OpenAI, Google, DeepL, AWS, Azure).')]
    case Machine = 'machine';

    /**
     * Bulk-imported from a `lang/*` file or reconciliation job.
     */
    #[Label('Import')]
    #[Description('Bulk-imported from a `lang/*` file at seed time or via the reconcile-cache command.')]
    case Import = 'import';
}
