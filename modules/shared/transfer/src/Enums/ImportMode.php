<?php

declare(strict_types=1);

namespace Academorix\Transfer\Enums;

use Academorix\Enum\Attributes\Description;
use Academorix\Enum\Attributes\Label;
use Academorix\Enum\Attributes\Meta;
use Academorix\Enum\Enum;

/**
 * Import execution mode for an `#[Importable]`-marked entity.
 *
 * ## Cases
 *
 *  * {@see self::Append}  — insert-only. Duplicate keys are treated as errors.
 *  * {@see self::Upsert}  — insert-or-update on the entity's configured `uniqueBy` key.
 *  * {@see self::Replace} — atomic replace of the tenant's rows for the entity
 *    (delete-all + insert). Runs inside a transaction.
 *  * {@see self::Delete}  — delete only. Matching rows in the source are removed.
 *
 * @category Transfer
 *
 * @since    0.1.0
 */
#[Meta([Label::class, Description::class])]
enum ImportMode: string
{
    use Enum;

    /**
     * Append rows — insert-only, duplicates are errors.
     */
    #[Label('Append')]
    #[Description('Insert new rows only. Duplicate keys are recorded as errors.')]
    case Append = 'append';

    /**
     * Upsert rows — insert new, update existing on the `uniqueBy` key.
     */
    #[Label('Upsert')]
    #[Description('Insert new rows and update existing rows matched on the entity uniqueBy key.')]
    case Upsert = 'upsert';

    /**
     * Replace rows — delete every tenant row for the entity, then insert.
     */
    #[Label('Replace')]
    #[Description('Replace every tenant row for the entity — delete-all + insert. Atomic.')]
    case Replace = 'replace';

    /**
     * Delete rows — remove rows matched by the source file.
     */
    #[Label('Delete')]
    #[Description('Delete tenant rows matched by the source file (by uniqueBy key).')]
    case Delete = 'delete';
}
