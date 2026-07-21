<?php

declare(strict_types=1);

namespace Academorix\Geofencing\Exceptions;

use Stackra\Exceptions\StackraException;

/**
 * Raised when a fenceable resolves to a row outside the caller's tenant OR
 * cannot be resolved at all.
 *
 * Deliberately collapses "not found" + "wrong tenant" + "unknown alias" to
 * prevent enumeration.
 *
 * @category Geofencing
 *
 * @since    0.1.0
 */
final class FenceableNotInTenantException extends StackraException
{
    public const string CODE = 'geofencing.fenceable_not_in_tenant';

    public const string TRANSLATION_KEY = 'geofencing::errors.fenceable_not_in_tenant';
}
