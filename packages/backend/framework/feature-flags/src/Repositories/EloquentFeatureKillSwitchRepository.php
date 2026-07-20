<?php

declare(strict_types=1);

namespace Academorix\FeatureFlags\Repositories;

use Academorix\Crud\Attributes\AsRepository;
use Academorix\Crud\Attributes\Cacheable;
use Academorix\Crud\Attributes\Filterable;
use Academorix\Crud\Attributes\UseModel;
use Academorix\Crud\Repositories\Repository;
use Academorix\FeatureFlags\Contracts\Data\FeatureKillSwitchInterface;
use Academorix\FeatureFlags\Contracts\Repositories\FeatureKillSwitchRepositoryInterface;
use Academorix\FeatureFlags\Models\FeatureKillSwitch;
use Academorix\FeatureFlags\Support\ScopePath;
use Illuminate\Support\Carbon;

/**
 * Attribute-first Eloquent implementation of {@see FeatureKillSwitchRepositoryInterface}.
 *
 * ## What this class owns
 *
 * The resolver's hot-path finder for kill-switch rows plus the
 * NULL-scope-value semantics ("every value at this level"):
 *
 *   - {@see findMatching()} — deepest-wins lookup with active-window
 *     filter and NULL-scope-value expansion. Called once per flag
 *     evaluation by `KillSwitchLayer`.
 *
 * CRUD comes for free from {@see Repository}. Model resolution is
 * driven by `#[UseModel]`. Platform-scoped — no tenant filter.
 *
 * @extends Repository<FeatureKillSwitch>
 *
 * @category FeatureFlags
 *
 * @since    0.1.0
 */
#[AsRepository]
#[UseModel(FeatureKillSwitchInterface::class)]
#[Cacheable(ttl: 60, tags: true, invalidateOn: ['created', 'updated', 'deleted'])]
#[Filterable([
    FeatureKillSwitchInterface::ATTR_FLAG        => ['$eq', '$in'],
    FeatureKillSwitchInterface::ATTR_SCOPE_LEVEL => ['$eq', '$in'],
])]
final class EloquentFeatureKillSwitchRepository extends Repository implements FeatureKillSwitchRepositoryInterface
{
    /**
     * {@inheritDoc}
     *
     * Filters:
     *   - `flag` = $flag
     *   - `scope_level` IN keys of `$path->sortedLevels()`
     *   - `scope_value` IS NULL OR `scope_value` = `$path->valueAt($row->scope_level)`
     *   - `enabled_at` <= now()
     *   - `disabled_at` IS NULL OR `disabled_at` > now()
     *
     * Sort: `scope_level` sort_order descending; first row wins.
     */
    public function findMatching(string $flag, ScopePath $path): ?FeatureKillSwitch
    {
        $sortOrders = $path->sortedLevels();
        if ($sortOrders === []) {
            return null;
        }

        $now = Carbon::now();
        $levels = array_keys($sortOrders);

        /** @var array<int, FeatureKillSwitch> $candidates */
        $candidates = $this->query()
            ->where(FeatureKillSwitchInterface::ATTR_FLAG, $flag)
            ->whereIn(FeatureKillSwitchInterface::ATTR_SCOPE_LEVEL, $levels)
            ->where(FeatureKillSwitchInterface::ATTR_ENABLED_AT, '<=', $now)
            ->where(function ($query) use ($now): void {
                $query->whereNull(FeatureKillSwitchInterface::ATTR_DISABLED_AT)
                    ->orWhere(FeatureKillSwitchInterface::ATTR_DISABLED_AT, '>', $now);
            })
            ->get()
            ->all();

        // NULL scope_value = "every value at this level" — matches unconditionally.
        // Non-NULL scope_value = specific entity — must equal $path->valueAt($level).
        $matching = [];
        foreach ($candidates as $row) {
            $level = (string) $row->getAttribute(FeatureKillSwitchInterface::ATTR_SCOPE_LEVEL);
            $rowValue = $row->getAttribute(FeatureKillSwitchInterface::ATTR_SCOPE_VALUE);
            if ($rowValue === null || $path->valueAt($level) === (string) $rowValue) {
                $matching[] = $row;
            }
        }

        if ($matching === []) {
            return null;
        }

        // Deepest wins — highest sort_order first.
        usort($matching, static function (FeatureKillSwitch $a, FeatureKillSwitch $b) use ($sortOrders): int {
            $ao = $sortOrders[(string) $a->getAttribute(FeatureKillSwitchInterface::ATTR_SCOPE_LEVEL)] ?? PHP_INT_MIN;
            $bo = $sortOrders[(string) $b->getAttribute(FeatureKillSwitchInterface::ATTR_SCOPE_LEVEL)] ?? PHP_INT_MIN;

            return $bo <=> $ao;
        });

        return $matching[0];
    }
}
