<?php

declare(strict_types=1);

namespace Stackra\Domains\Exceptions;

use Stackra\Exceptions\Exception;

/**
 * Raised when a request lands on a Host header that maps to no
 * Domain row (in scenarios that require one).
 *
 * @category Domains
 *
 * @since    0.1.0
 */
final class DomainNotFoundException extends Exception
{
    public const CODE = 'domains.not_found';

    public const TRANSLATION_KEY = 'domains::errors.not_found';
}
