<?php

declare(strict_types=1);

namespace Stackra\Domains\Exceptions;

use Stackra\Exceptions\StackraException;

/**
 * Raised when a caller attempts to promote an unverified Domain to
 * primary. Enforced by DomainPolicy + DomainObserver.
 *
 * @category Domains
 *
 * @since    0.1.0
 */
final class DomainNotVerifiedException extends StackraException
{
    public const CODE = 'domains.not_verified';

    public const TRANSLATION_KEY = 'domains::errors.not_verified';
}
