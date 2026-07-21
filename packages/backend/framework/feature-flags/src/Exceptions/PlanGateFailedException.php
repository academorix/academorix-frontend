<?php

declare(strict_types=1);

namespace Stackra\FeatureFlags\Exceptions;

use Stackra\Exceptions\AcademorixException;

/**
 * Raised when the plan-gate entitlement lookup itself errors.
 *
 * `PlanGateLayer` throws this when the subscription service is
 * unreachable or the entitlement store is corrupt — distinct from
 * a clean "plan does not grant this feature" outcome, which is
 * represented by `FeatureResolution::planGate(false)` and surfaces
 * as HTTP 402 via `FeatureDisabledException`.
 *
 * @category FeatureFlags
 *
 * @since    0.1.0
 */
final class PlanGateFailedException extends AcademorixException
{
    /**
     * Stable machine-readable error code emitted on the JSON envelope.
     */
    public const CODE = 'feature_flags.plan_gate_failed';

    /**
     * Translation key for the humanised message.
     */
    public const TRANSLATION_KEY = 'feature-flags::errors.plan_gate_failed';

    /**
     * Convenience factory naming the flag + tenant that failed.
     *
     * @param  string  $flag      Flag identifier under evaluation.
     * @param  string  $tenantId  Tenant id whose subscription lookup errored.
     * @return self
     */
    public static function forTenant(string $flag, string $tenantId): self
    {
        return (new self("Plan-gate lookup for '{$flag}' failed for tenant {$tenantId}."))
            ->withContext(['flag' => $flag, 'tenant_id' => $tenantId]);
    }
}
