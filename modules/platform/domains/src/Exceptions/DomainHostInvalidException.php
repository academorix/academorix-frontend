<?php

declare(strict_types=1);

namespace Academorix\Domains\Exceptions;

use Academorix\Exceptions\AcademorixException;

/**
 * Raised when a host does not match the RFC 1035 label syntax.
 *
 * @category Domains
 *
 * @since    0.1.0
 */
final class DomainHostInvalidException extends AcademorixException
{
    public const CODE = 'domains.host_invalid';

    public const TRANSLATION_KEY = 'domains::errors.host_invalid';
}
