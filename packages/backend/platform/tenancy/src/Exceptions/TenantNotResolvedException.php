<?php

declare(strict_types=1);

namespace Stackra\Tenancy\Exceptions;

use Stackra\Exceptions\Exception;

/**
 * Raised when code asserts a tenant context but none is bound.
 *
 * Thrown by
 * {@see \Stackra\Tenancy\Contracts\Services\TenantContextInterface::currentOrFail()}
 * — the tenant-only actions call it before touching any tenant-scoped
 * data, so this exception surfaces as HTTP 404 on the central host
 * (the request hit a tenant-only route) or 500 elsewhere (bug —
 * middleware misordering).
 *
 * @category Tenancy
 *
 * @since    0.1.0
 */
final class TenantNotResolvedException extends Exception
{
    /**
     * Stable machine-readable error code emitted on the JSON envelope.
     */
    public const CODE = 'tenancy.tenant_not_resolved';

    /**
     * Translation key for the humanised message.
     */
    public const TRANSLATION_KEY = 'tenancy::errors.tenant_not_found';
}
