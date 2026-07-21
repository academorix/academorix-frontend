<?php

declare(strict_types=1);

namespace Stackra\Storage\Exceptions;

use Stackra\Exceptions\Exception;

/**
 * Raised when a File referenced by id or signature does not exist.
 *
 * @category Storage
 *
 * @since    0.1.0
 */
final class FileNotFoundException extends Exception
{
    public const CODE = 'storage.not_found';

    public const TRANSLATION_KEY = 'storage::errors.not_found';
}
