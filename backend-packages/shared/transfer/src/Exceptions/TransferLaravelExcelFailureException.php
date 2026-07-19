<?php

declare(strict_types=1);

namespace Academorix\Transfer\Exceptions;

use Academorix\Exceptions\AcademorixException;

/**
 * Wrapping exception for maatwebsite/excel failures so upstream
 * consumers never see the vendor exception directly.
 *
 * @category Transfer
 *
 * @since    0.1.0
 */
final class TransferLaravelExcelFailureException extends AcademorixException
{
    public const CODE = 'TRANSFER_LARAVEL_EXCEL_FAILURE';

    public const TRANSLATION_KEY = 'transfer::errors.laravel_excel_failure';
}
