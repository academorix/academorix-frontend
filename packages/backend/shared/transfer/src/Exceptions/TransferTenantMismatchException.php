<?php

declare(strict_types=1);

namespace Stackra\Transfer\Exceptions;

use Stackra\Exceptions\Exception;

/**
 * Raised when an import row carries a `tenant_id` column that
 * disagrees with the current tenant.
 *
 * @category Transfer
 *
 * @since    0.1.0
 */
final class TransferTenantMismatchException extends Exception
{
    public const CODE = 'TRANSFER_TENANT_MISMATCH';

    public const TRANSLATION_KEY = 'transfer::errors.tenant_mismatch';
}
