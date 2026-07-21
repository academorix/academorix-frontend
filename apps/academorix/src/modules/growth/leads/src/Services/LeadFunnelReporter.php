<?php

declare(strict_types=1);

namespace Academorix\Leads\Services;

use Academorix\Leads\Contracts\Data\LeadInterface;
use Academorix\Leads\Contracts\Services\LeadFunnelReporterInterface;
use Academorix\Leads\Enums\LeadStage;
use Academorix\Leads\Models\Lead;
use Illuminate\Container\Attributes\Scoped;

/**
 * Concrete implementation of {@see LeadFunnelReporterInterface}.
 *
 * Uses the `Lead` model directly (not the repository) because the
 * reporter needs raw grouped aggregates, not the CRUD hydration path.
 * `BelongsToTenant`'s global scope narrows every query to the active
 * tenant automatically.
 *
 * All queries include `whereNull(deleted_at)` (via `SoftDeletes` on
 * the model) so soft-deleted rows never contaminate a rollup.
 *
 * @category Leads
 *
 * @since    0.1.0
 */
#[Scoped]
final class LeadFunnelReporter implements LeadFunnelReporterInterface
{
    /**
     * {@inheritDoc}
     */
    public function stageCounts(?\DateTimeInterface $since = null, ?\DateTimeInterface $until = null): array
    {
        $rows = $this->baseQuery($since, $until)
            ->groupBy(LeadInterface::ATTR_STAGE)
            ->selectRaw(\sprintf('%s as stage, COUNT(*) as total', LeadInterface::ATTR_STAGE))
            ->pluck('total', 'stage')
            ->all();

        return $this->fillStageDefaults($rows);
    }

    /**
     * {@inheritDoc}
     */
    public function sourceCounts(?\DateTimeInterface $since = null, ?\DateTimeInterface $until = null): array
    {
        return $this->baseQuery($since, $until)
            ->groupBy(LeadInterface::ATTR_SOURCE)
            ->selectRaw(\sprintf('%s as source, COUNT(*) as total', LeadInterface::ATTR_SOURCE))
            ->pluck('total', 'source')
            ->map(static fn ($total): int => (int) $total)
            ->all();
    }

    /**
     * {@inheritDoc}
     */
    public function conversionRate(?\DateTimeInterface $since = null, ?\DateTimeInterface $until = null): float
    {
        $stageCounts = $this->stageCounts($since, $until);

        $won   = $stageCounts[LeadStage::Won->value] ?? 0;
        $total = \array_sum($stageCounts);

        if ($total <= 0) {
            return 0.0;
        }

        return \round($won / $total, 4);
    }

    /**
     * Build the base query — model scope applies `tenant_id` +
     * `deleted_at` automatically.
     *
     * @param  \DateTimeInterface|null  $since  Inclusive lower bound on `created_at`.
     * @param  \DateTimeInterface|null  $until  Inclusive upper bound on `created_at`.
     */
    private function baseQuery(?\DateTimeInterface $since, ?\DateTimeInterface $until): \Illuminate\Database\Eloquent\Builder
    {
        $query = Lead::query();

        if ($since !== null) {
            $query->where(LeadInterface::ATTR_CREATED_AT, '>=', $since);
        }

        if ($until !== null) {
            $query->where(LeadInterface::ATTR_CREATED_AT, '<=', $until);
        }

        return $query;
    }

    /**
     * Ensure every enum case is present in the response, defaulting
     * missing keys to zero. Downstream consumers (dashboards, charts)
     * rely on the full case set being non-nullable.
     *
     * @param  array<string, mixed>  $rows  Raw pluck output.
     * @return array<string, int>           Filled stage counts.
     */
    private function fillStageDefaults(array $rows): array
    {
        $result = [];

        foreach (LeadStage::cases() as $case) {
            $result[$case->value] = (int) ($rows[$case->value] ?? 0);
        }

        return $result;
    }
}
