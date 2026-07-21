<?php

declare(strict_types=1);

namespace Stackra\Leads\Contracts\Services;

use Stackra\Leads\Services\LeadFunnelReporter;
use Illuminate\Container\Attributes\Bind;
use Illuminate\Container\Attributes\Scoped;

/**
 * Service contract — funnel + source rollups over the `leads` table.
 *
 * Backs `GET /api/v1/leads/reports/funnel` + admin dashboards. Every
 * report is scoped to the caller's active tenant by `BelongsToTenant`
 * on the model — the reporter does NOT accept a tenant id argument.
 *
 * Bound to the concrete via `#[Bind(LeadFunnelReporter::class)]`.
 *
 * @category Leads
 *
 * @since    0.1.0
 */
#[Bind(LeadFunnelReporter::class)]
#[Scoped]
interface LeadFunnelReporterInterface
{
    /**
     * Count active (non-lost) leads per stage for the caller's tenant.
     *
     * Returned map is keyed by the backing enum value (`NEW`,
     * `CONTACTED`, `QUALIFIED`, `TRIAL`, `WON`, `LOST`). Missing keys
     * are populated with `0` so consumers never have to defend against
     * a nullable count.
     *
     * @param  \DateTimeInterface|null  $since   Inclusive lower bound on `created_at`. `null` = no lower bound.
     * @param  \DateTimeInterface|null  $until   Inclusive upper bound on `created_at`. `null` = no upper bound.
     * @return array<string, int>                Stage value → row count.
     */
    public function stageCounts(?\DateTimeInterface $since = null, ?\DateTimeInterface $until = null): array;

    /**
     * Count leads by source for the caller's tenant.
     *
     * @param  \DateTimeInterface|null  $since   Inclusive lower bound on `created_at`.
     * @param  \DateTimeInterface|null  $until   Inclusive upper bound on `created_at`.
     * @return array<string, int>                Source value → row count.
     */
    public function sourceCounts(?\DateTimeInterface $since = null, ?\DateTimeInterface $until = null): array;

    /**
     * Overall conversion rate — WON / (WON + LOST + everything active)
     * — for the caller's tenant, expressed as a float in `[0.0, 1.0]`.
     *
     * @param  \DateTimeInterface|null  $since   Inclusive lower bound on `created_at`.
     * @param  \DateTimeInterface|null  $until   Inclusive upper bound on `created_at`.
     * @return float                             Conversion rate. Returns 0.0 when there are no leads in the window.
     */
    public function conversionRate(?\DateTimeInterface $since = null, ?\DateTimeInterface $until = null): float;
}
