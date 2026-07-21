<?php

declare(strict_types=1);

namespace Stackra\Storage\Exceptions;

use Stackra\Exceptions\Exception;

/**
 * Raised when a tenant's byte or file quota would be crossed by
 * an incoming upload.
 *
 * @category Storage
 *
 * @since    0.1.0
 */
final class StorageQuotaExceededException extends Exception
{
    public const CODE = 'storage.quota_exceeded';

    public const TRANSLATION_KEY = 'storage::errors.quota_exceeded';
}
