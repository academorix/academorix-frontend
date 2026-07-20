<?php

declare(strict_types=1);

namespace Academorix\Domains\Exceptions;

use Academorix\Exceptions\AcademorixException;

/**
 * Raised when a request lands on a Host header that maps to no
 * Domain row (in scenarios that require one).
 *
 * @category Domains
 *
 * @since    0.1.0
 */
final class DomainNotFoundException extends AcademorixException
{
    public const CODE = 'domains.not_found';

    public const TRANSLATION_KEY = 'domains::errors.not_found';
}
