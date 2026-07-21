<?php

declare(strict_types=1);

namespace Stackra\Domains\Exceptions;

use Stackra\Exceptions\Exception;

/**
 * Raised when a caller attempts to delete the tenant's last primary
 * Domain. Would leave the tenant with no way to reach the
 * application; must promote another domain first.
 *
 * @category Domains
 *
 * @since    0.1.0
 */
final class LastPrimaryDomainException extends Exception
{
    public const CODE = 'domains.last_primary';

    public const TRANSLATION_KEY = 'domains::errors.last_primary';
}
