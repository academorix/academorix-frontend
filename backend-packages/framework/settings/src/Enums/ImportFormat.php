<?php

declare(strict_types=1);

/**
 * Import Format Enumeration
 *
 * Defines the set of allowed values for Import Format within the Settings module.
 * Supported values include: Csv, Xlsx, Json.
 *
 * @category Enums
 *
 * @since    1.0.0
 */
namespace Academorix\Settings\Enums;

use Academorix\Enum\Attributes\Description;
use Academorix\Enum\Attributes\Label;
use Academorix\Enum\Enum;

/**
 * Import Format Enum.
 *
 * Supported data import formats for uploading and ingesting data.
 *
 * @method static CSV()  Returns the CSV enum instance
 * @method static XLSX() Returns the XLSX enum instance
 * @method static JSON() Returns the JSON enum instance
 *
 * @since 1.0.0
 */
enum ImportFormat: string
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
     * JavaScript Object Notation format.
     */
    #[Label('JSON')]
    #[Description('JavaScript Object Notation format. Ideal for programmatic data exchange.')]
    case Json = 'json';
}
