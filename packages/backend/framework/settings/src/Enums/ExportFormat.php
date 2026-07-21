<?php

declare(strict_types=1);

/**
 * Export Format Enumeration
 *
 * Defines the set of allowed values for Export Format within the Settings module.
 * Supported values include: Csv, Xlsx, Pdf, Json.
 *
 * @category Enums
 *
 * @since    1.0.0
 */
namespace Stackra\Settings\Enums;

use Stackra\Enum\Attributes\Description;
use Stackra\Enum\Attributes\Label;
use Stackra\Enum\Enum;

/**
 * Export Format Enum.
 *
 * Supported data export formats for downloading or sharing data.
 *
 * @method static CSV()  Returns the CSV enum instance
 * @method static XLSX() Returns the XLSX enum instance
 * @method static PDF()  Returns the PDF enum instance
 * @method static JSON() Returns the JSON enum instance
 *
 * @since 1.0.0
 */
enum ExportFormat: string
{
    use Enum;

    /**
     * Comma-separated values format.
     */
    #[Label('CSV')]
    #[Description('Comma-separated values format. Widely supported by spreadsheet applications.')]
    case Csv = 'csv';

    /**
     * Microsoft Excel Open XML Spreadsheet format.
     */
    #[Label('Excel (XLSX)')]
    #[Description('Microsoft Excel Open XML Spreadsheet format with rich formatting support.')]
    case Xlsx = 'xlsx';

    /**
     * Portable Document Format.
     */
    #[Label('PDF')]
    #[Description('Portable Document Format. Ideal for print-ready and read-only exports.')]
    case Pdf = 'pdf';

    /**
     * JavaScript Object Notation format.
     */
    #[Label('JSON')]
    #[Description('JavaScript Object Notation format. Ideal for programmatic data exchange.')]
    case Json = 'json';
}
