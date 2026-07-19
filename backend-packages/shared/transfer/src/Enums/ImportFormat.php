<?php

declare(strict_types=1);

namespace Academorix\Transfer\Enums;

use Academorix\Enum\Attributes\Description;
use Academorix\Enum\Attributes\Label;
use Academorix\Enum\Attributes\Meta;
use Academorix\Enum\Enum;

/**
 * Supported import source formats.
 *
 * ## Cases
 *
 *  * {@see self::Xlsx} — Microsoft Excel workbook (xlsx).
 *  * {@see self::Csv}  — Comma-separated values.
 *  * {@see self::Xls}  — Legacy Microsoft Excel workbook (xls).
 *
 * @category Transfer
 *
 * @since    0.1.0
 */
#[Meta([Label::class, Description::class])]
enum ImportFormat: string
{
    use Enum;

    /**
     * Microsoft Excel workbook (xlsx).
     */
    #[Label('XLSX')]
    #[Description('Microsoft Excel workbook (xlsx).')]
    case Xlsx = 'xlsx';

    /**
     * Comma-separated values (csv).
     */
    #[Label('CSV')]
    #[Description('Comma-separated values file.')]
    case Csv = 'csv';

    /**
     * Legacy Microsoft Excel workbook (xls).
     */
    #[Label('XLS')]
    #[Description('Legacy Microsoft Excel workbook (xls).')]
    case Xls = 'xls';
}
