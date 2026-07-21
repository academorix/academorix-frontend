<?php

declare(strict_types=1);

namespace Stackra\Tenancy\Exceptions;

use Stackra\Exceptions\StackraException;

/**
 * Raised when a mutation targets a row with `is_system = true`.
 *
 * System tenants (e.g. Stackra's own demo/support tenant) refuse
 * update / delete regardless of the caller's permissions. Guarded by
 * `TenantObserver` + `TenantPolicy` together.
 *
 * @category Tenancy
 *
 * @since    0.1.0
 */
final class SystemTenantException extends StackraException
{
    public const CODE = 'tenancy.system_row_refused';

    public const TRANSLATION_KEY = 'tenancy::errors.system_row_refused';
}
