<?php

declare(strict_types=1);

namespace Academorix\Storage\Exceptions;

use Academorix\Exceptions\AcademorixException;

/**
 * Raised when a tenant's byte or file quota would be crossed by
 * an incoming upload.
 *
 * @category Storage
 *
 * @since    0.1.0
 */
final class StorageQuotaExceededException extends AcademorixException
{
    public const CODE = 'storage.quota_exceeded';

    public const TRANSLATION_KEY = 'storage::errors.quota_exceeded';
}
