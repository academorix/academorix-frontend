<?php

declare(strict_types=1);

namespace Stackra\Tenancy\Exceptions;

use Stackra\Exceptions\AcademorixException;

/**
 * Raised when a request lands on a tenant with `status = suspended`.
 *
 * Read paths still work (the customer can access their data); write
 * paths refuse. Enforced by {@see \Stackra\Tenancy\Middleware\EnsureUserBelongsToTenant}
 * plus per-action gates.
 *
 * @category Tenancy
 *
 * @since    0.1.0
 */
final class TenantSuspendedException extends AcademorixException
{
    /**
     * Stable machine-readable error code emitted on the JSON envelope.
     */
    public const CODE = 'tenancy.tenant_suspended';

    /**
     * Translation key for the humanised message.
     */
    public const TRANSLATION_KEY = 'tenancy::errors.tenant_suspended';
}
