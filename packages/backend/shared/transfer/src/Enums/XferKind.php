<?php

declare(strict_types=1);

namespace Stackra\Transfer\Enums;

use Stackra\Enum\Attributes\Description;
use Stackra\Enum\Attributes\Label;
use Stackra\Enum\Attributes\Meta;
use Stackra\Enum\Enum;

/**
 * Kind of transfer operation an `xfer_jobs` row represents.
 *
 * ## Cases
 *
 *  * {@see self::Import} — read rows from a source file into the DB.
 *  * {@see self::Export} — write DB rows into a downloadable file.
 *  * {@see self::Sample} — generate fixture rows for a registered entity.
 *
 * @category Transfer
 *
 * @since    0.1.0
 */
#[Meta([Label::class, Description::class])]
enum XferKind: string
{
    use Enum;

    /**
     * Import — read rows from a source file into the DB.
     */
    #[Label('Import')]
    #[Description('Read rows from a source file into the DB.')]
    case Import = 'import';

    /**
     * Export — write DB rows into a downloadable file.
     */
    #[Label('Export')]
    #[Description('Write DB rows into a downloadable file.')]
    case Export = 'export';

    /**
     * Sample — generate fixture rows for a registered entity.
     */
    #[Label('Sample')]
    #[Description('Generate fixture rows for a registered entity.')]
    case Sample = 'sample';
}
