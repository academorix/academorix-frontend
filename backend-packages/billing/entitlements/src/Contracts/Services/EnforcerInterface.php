<?php

declare(strict_types=1);

namespace Academorix\Entitlements\Contracts\Services;

use Academorix\Entitlements\Services\DefaultEnforcer;
use Illuminate\Container\Attributes\Bind;

/**
 * Composite service — resolve, check, record.
 *
 * The primary consumer surface: `->consume($tenant, $key)` decides
 * whether the operation is allowed AND records the usage row when it
 * succeeds. Every metered domain endpoint routes through the enforcer.
 *
 * Fires `EntitlementExceeded` when the check fails; returns `false`
 * to the caller so it can raise its own HTTP 402 with a specific
 * payload.
 *
 * @category Entitlements
 *
 * @since    0.1.0
 */
#[Bind(DefaultEnforcer::class)]
interface EnforcerInterface
{
    /**
     * Try to consume `$amount` of an entitlement.
     *
     * @param  string       $tenantId       Owning tenant.
     * @param  string       $key            Dot-separated identifier.
     * @param  int          $amount         Units to consume (default 1).
     * @param  string       $reason         Machine-readable reason for the audit row.
     * @param  string|null  $correlationId  Trace correlation id.
     * @return bool                         True when the consumption fit, false when exceeded.
     */
    public function consume(
        string $tenantId,
        string $key,
        int $amount = 1,
        string $reason = 'consumption',
        ?string $correlationId = null,
    ): bool;

    /**
     * Peek — check whether `$amount` COULD be consumed without actually
     * recording a row. Used by pre-flight middleware.
     */
    public function canConsume(string $tenantId, string $key, int $amount = 1): bool;
}
