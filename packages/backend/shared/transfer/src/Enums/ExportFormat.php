<?php

declare(strict_types=1);

namespace Academorix\Transfer\Enums;

use Academorix\Enum\Attributes\Description;
use Academorix\Enum\Attributes\Label;
use Academorix\Enum\Attributes\Meta;
use Academorix\Enum\Enum;

/**
 * Supported export formats.
 *
 * ## Cases
 *
 *  * {@see self::Xlsx} — Microsoft Excel workbook.
 *  * {@see self::Csv}  — Comma-separated values.
 *  * {@see self::Pdf}  — Rendered PDF document.
 *  * {@see self::Json} — JSON stream.
 *
 * @category Transfer
 *
 * @since    0.1.0
 */
#[Meta([Label::class, Description::class])]
enum ExportFormat: string
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
     * Rendered PDF document.
     */
    #[Label('PDF')]
    #[Description('Rendered PDF document.')]
    case Pdf = 'pdf';

    /**
     * JSON stream — one row per object.
     */
    #[Label('JSON')]
    #[Description('JSON stream — one row per object.')]
    case Json = 'json';

    /**
     * MIME type sent as the `Content-Type` header when serving the artifact.
     */
    public function mimeType(): string
    {
        return match ($this) {
            self::Xlsx => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            self::Csv  => 'text/csv',
            self::Pdf  => 'application/pdf',
            self::Json => 'application/json',
        };
    }
}
