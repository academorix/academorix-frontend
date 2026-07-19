<?php

declare(strict_types=1);

namespace Academorix\Tenancy\Exceptions;

use Academorix\Exceptions\AcademorixException;

/**
 * Raised when a request lands on a tenant with `status = archived`.
 *
 * Every action refuses — the tenant is awaiting hard-delete after
 * the 30-day retention window (per `retention.json`).
 *
 * @category Tenancy
 *
 * @since    0.1.0
 */
final class TenantArchivedException extends AcademorixException
{
    /**
     * Stable machine-readable error code emitted on the JSON envelope.
     */
    public const CODE = 'tenancy.tenant_archived';

    /**
     * Translation key for the humanised message.
     */
    public const TRANSLATION_KEY = 'tenancy::errors.tenant_archived';
}
