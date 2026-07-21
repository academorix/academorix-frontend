<?php

declare(strict_types=1);

namespace Stackra\Entitlements\Contracts\Services;

use Stackra\Entitlements\Models\Entitlement;
use Stackra\Entitlements\Models\EntitlementUsage;
use Stackra\Entitlements\Services\DefaultUsageRecorder;
use Illuminate\Container\Attributes\Bind;

/**
 * Persist a consumption event as an append-only `EntitlementUsage` row.
 *
 * The recorder fires `EntitlementConsumed` after the row commits.
 * Callers pass the resolved `Entitlement` (not a `(tenant_id, key)`
 * tuple) — that way one resolve + one record share the same row.
 *
 * @category Entitlements
 *
 * @since    0.1.0
 */
#[Bind(DefaultUsageRecorder::class)]
interface UsageRecorderInterface
{
    /**
     * Record a consumption event.
     *
     * @param  Entitlement  $entitlement    The resolved parent entitlement.
     * @param  int          $delta          Positive for consumption, negative for refund.
     * @param  string       $reason         Machine-readable reason (e.g. `webhook.subscription.created`).
     * @param  string|null  $correlationId  Correlation id — carried onto the row for downstream traces.
     * @return EntitlementUsage             The persisted usage row.
     */
    public function record(
        Entitlement $entitlement,
        int $delta,
        string $reason,
        ?string $correlationId = null,
    ): EntitlementUsage;
}
