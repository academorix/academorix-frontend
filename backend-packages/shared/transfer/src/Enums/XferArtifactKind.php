<?php

declare(strict_types=1);

namespace Academorix\Transfer\Enums;

use Academorix\Enum\Attributes\Description;
use Academorix\Enum\Attributes\Label;
use Academorix\Enum\Attributes\Meta;
use Academorix\Enum\Enum;

/**
 * Kind of file an `xfer_artifacts` row points at.
 *
 * ## Cases
 *
 *  * {@see self::Result}   — the primary output file of an export or import.
 *  * {@see self::Errors}   — an errors.csv artifact from a partially-succeeded import.
 *  * {@see self::Source}   — the uploaded source file for a stored import.
 *  * {@see self::Template} — empty template downloaded via `/templates/{entity}`.
 *
 * @category Transfer
 *
 * @since    0.1.0
 */
#[Meta([Label::class, Description::class])]
enum XferArtifactKind: string
{
    use Enum;

    /**
     * Result — the primary output of an export or the result summary of an import.
     */
    #[Label('Result')]
    #[Description('Primary output of an export or result summary of an import.')]
    case Result = 'result';

    /**
     * Errors — the errors.csv artifact from a partially-succeeded import.
     */
    #[Label('Errors')]
    #[Description('The errors.csv artifact from a partially-succeeded import.')]
    case Errors = 'errors';

    /**
     * Source — the uploaded source file for a stored import.
     */
    #[Label('Source')]
    #[Description('The uploaded source file for a stored import.')]
    case Source = 'source';

    /**
     * Template — empty template downloaded via `/templates/{entity}`.
     */
    #[Label('Template')]
    #[Description('Empty template downloaded via /templates/{entity}.')]
    case Template = 'template';
}
