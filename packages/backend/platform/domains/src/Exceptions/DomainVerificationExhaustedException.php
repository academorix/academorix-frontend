<?php

declare(strict_types=1);

namespace Stackra\Domains\Exceptions;

use Stackra\Exceptions\StackraException;

/**
 * Raised when `verification_attempts` hits the 100 cap. Requires a
 * manual replay via `domains:reverify --force`.
 *
 * @category Domains
 *
 * @since    0.1.0
 */
final class DomainVerificationExhaustedException extends StackraException
{
    public const CODE = 'domains.verification_exhausted';

    public const TRANSLATION_KEY = 'domains::errors.verification_exhausted';
}
