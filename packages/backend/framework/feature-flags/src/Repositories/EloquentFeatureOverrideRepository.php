<?php

declare(strict_types=1);

namespace Stackra\FeatureFlags\Repositories;

use Stackra\Crud\Attributes\AsRepository;
use Stackra\Crud\Attributes\Cacheable;
use Stackra\Crud\Attributes\Filterable;
use Stackra\Crud\Attributes\UseModel;
use Stackra\Crud\Repositories\Repository;
use Stackra\FeatureFlags\Contracts\Data\FeatureOverrideInterface;
use Stackra\FeatureFlags\Contracts\Repositories\FeatureOverrideRepositoryInterface;
use Stackra\FeatureFlags\Models\FeatureOverride;
use Stackra\FeatureFlags\Support\ScopePath;
use Illuminate\Support\Carbon;

/**
 * Attribute-first Eloquent implementation of {@see FeatureOverrideRepositoryInterface}.
 *
 * ## What this class owns
 *
 * The resolver's hot-path finder plus domain-level "deepest wins"
 * precedence sort:
 *
 *   - {@see findMatching()} — deepest-wins lookup under the active
 *     tenant scope, filtered by the `(expires_at)` window. Called
 *     exactly once per flag evaluation by `OverrideLayer`.
 *
 * CRUD comes for free from {@see Repository}. Model resolution is
 * driven by `#[UseModel]`; tenant scope is enforced automatically
 * by `BelongsToTenant` on the model.
 *
 * @extends Repository<FeatureOverride>
 *
 * @category FeatureFlags
 *
 * @since    0.1.0
 */
#[AsRepository]
#[UseModel(FeatureOverrideInterface::class)]
#[Cacheable(ttl: 3600, tags: true, invalidateOn: ['created', 'updated', 'deleted'])]
#[Filterable([
    FeatureOverrideInterface::ATTR_FLAG        => ['$eq', '$in'],
    FeatureOverrideInterface::ATTR_SCOPE_LEVEL => ['$eq', '$in'],
    FeatureOverrideInterface::ATTR_DECISION    => ['$eq'],
])]
final class EloquentFeatureOverrideRepository extends Repository implements FeatureOverrideRepositoryInterface
{
    /**
     * {@inheritDoc}
     *
     * Filters:
     *   - `scope_level` IN keys of `$path->sortedLevels()`
     *   - `scope_value` matches `$path->valueAt($row->scope_level)`
     *   - `expires_at` is NULL OR in the future
     *
     * Sort: `scope_level` sort_order descending; first row wins.
     * Tenant scope is enforced automatically by `BelongsToTenant`.
     */
    public function findMatching(string $flag, ScopePath $path): ?FeatureOverride
    {
        $sortOrders = $path->sortedLevels();
        if ($sortOrders === []) {
            return null;
        }

        $levels = array_keys($sortOrders);

        /** @var array<int, FeatureOverride> $candidates */
        $candidates = $this->query()
            ->where(FeatureOverrideInterface::ATTR_FLAG, $flag)
            ->whereIn(FeatureOverrideInterface::ATTR_SCOPE_LEVEL, $levels)
            ->where(function ($query): void {
                $query->whereNull(FeatureOverrideInterface::ATTR_EXPIRES_AT)
                    ->orWhere(FeatureOverrideInterface::ATTR_EXPIRES_AT, '>', Carbon::now());
            })
            ->get()
            ->all();

        $matching = [];
        foreach ($candidates as $row) {
            $level = (string) $row->getAttribute(FeatureOverrideInterface::ATTR_SCOPE_LEVEL);
            $value = (string) $row->getAttribute(FeatureOverrideInterface::ATTR_SCOPE_VALUE);
            if ($path->valueAt($level) === $value) {
                $matching[] = $row;
            }
        }

        if ($matching === []) {
            return null;
        }

        // Deepest wins — highest sort_order first.
        usort($matching, static function (FeatureOverride $a, FeatureOverride $b) use ($sortOrders): int {
            $ao = $sortOrders[(string) $a->getAttribute(FeatureOverrideInterface::ATTR_SCOPE_LEVEL)] ?? PHP_INT_MIN;
            $bo = $sortOrders[(string) $b->getAttribute(FeatureOverrideInterface::ATTR_SCOPE_LEVEL)] ?? PHP_INT_MIN;

            return $bo <=> $ao;
        });

        return $matching[0];
    }
}
