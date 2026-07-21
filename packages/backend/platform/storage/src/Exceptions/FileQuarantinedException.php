<?php

declare(strict_types=1);

namespace Stackra\Storage\Exceptions;

use Stackra\Exceptions\Exception;

/**
 * Raised when a caller tries to read a File whose
 * `virus_scan_state` is not `clean`.
 *
 * @category Storage
 *
 * @since    0.1.0
 */
final class FileQuarantinedException extends Exception
{
    public const CODE = 'storage.quarantined';

    public const TRANSLATION_KEY = 'storage::errors.quarantined';
}
