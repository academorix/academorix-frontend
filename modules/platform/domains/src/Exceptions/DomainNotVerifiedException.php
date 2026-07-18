<?php

declare(strict_types=1);

namespace Academorix\Domains\Exceptions;

use Academorix\Exceptions\AcademorixException;

/**
 * Raised when a caller attempts to promote an unverified Domain to
 * primary. Enforced by DomainPolicy + DomainObserver.
 *
 * @category Domains
 *
 * @since    0.1.0
 */
final class DomainNotVerifiedException extends AcademorixException
{
    public const CODE = 'domains.not_verified';

    public const TRANSLATION_KEY = 'domains::errors.not_verified';
}
