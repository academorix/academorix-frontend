<?php

declare(strict_types=1);

namespace Stackra\Domains\Exceptions;

use Stackra\Exceptions\Exception;

/**
 * Raised when a host does not match the RFC 1035 label syntax.
 *
 * @category Domains
 *
 * @since    0.1.0
 */
final class DomainHostInvalidException extends Exception
{
    public const CODE = 'domains.host_invalid';

    public const TRANSLATION_KEY = 'domains::errors.host_invalid';
}
