<?php

declare(strict_types=1);

namespace Stackra\Tenancy\Exceptions;

use Stackra\Exceptions\StackraException;

/**
 * Raised when a save attempts to write a row with a `tenant_id`
 * different from the resolved tenant.
 *
 * Enforced by {@see \Stackra\Tenancy\Concerns\BelongsToTenant} on
 * every `saving` event. Always a bug OR an attack — the exception
 * routes to the `security` audit channel and pages on-call per
 * `tenants.audit.cross_tenant_alert_channel`.
 *
 * @category Tenancy
 *
 * @since    0.1.0
 */
final class CrossTenantWriteException extends StackraException
{
    /**
     * Stable machine-readable error code emitted on the JSON envelope.
     */
    public const CODE = 'tenancy.cross_tenant_write';

    /**
     * Translation key for the humanised message.
     */
    public const TRANSLATION_KEY = 'tenancy::errors.cross_tenant_access';

    /**
     * Factory for the `BelongsToTenant` saving hook.
     *
     * @param  string  $expected  The resolved tenant id (what should have been used).
     * @param  string  $actual    The tenant id the caller passed.
     * @param  string  $model     FQCN of the model on which the write was attempted.
     */
    public static function forMismatch(string $expected, string $actual, string $model): self
    {
        return (new self(\sprintf(
            'Cross-tenant write refused on %s (expected tenant_id=%s, got %s).',
            $model,
            $expected,
            $actual,
        )))->withContext([
            'model'             => $model,
            'expected_tenant'   => $expected,
            'attempted_tenant'  => $actual,
        ]);
    }
}
