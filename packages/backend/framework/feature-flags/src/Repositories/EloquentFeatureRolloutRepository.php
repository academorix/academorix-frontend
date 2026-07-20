<?php

declare(strict_types=1);

namespace Academorix\FeatureFlags\Repositories;

use Academorix\Crud\Attributes\AsRepository;
use Academorix\Crud\Attributes\Cacheable;
use Academorix\Crud\Attributes\Filterable;
use Academorix\Crud\Attributes\UseModel;
use Academorix\Crud\Repositories\Repository;
use Academorix\FeatureFlags\Contracts\Data\FeatureRolloutInterface;
use Academorix\FeatureFlags\Contracts\Repositories\FeatureRolloutRepositoryInterface;
use Academorix\FeatureFlags\Models\FeatureRollout;
use Illuminate\Support\Carbon;

/**
 * Attribute-first Eloquent implementation of {@see FeatureRolloutRepositoryInterface}.
 *
 * ## What this class owns
 *
 * The resolver's hot-path finder for rollout rows:
 *
 *   - {@see findActiveFor()} — returns the single active rollout
 *     row at the target `(tenant, flag, scope_level)` triple.
 *     Called once per flag evaluation by `RolloutLayer`.
 *
 * CRUD comes for free from {@see Repository}. Model resolution is
 * driven by `#[UseModel]`; tenant scope is enforced automatically
 * by `BelongsToTenant` on the model.
 *
 * @extends Repository<FeatureRollout>
 *
 * @category FeatureFlags
 *
 * @since    0.1.0
 */
#[AsRepository]
#[UseModel(FeatureRolloutInterface::class)]
#[Cacheable(ttl: 3600, tags: true, invalidateOn: ['created', 'updated', 'deleted'])]
#[Filterable([
    FeatureRolloutInterface::ATTR_FLAG        => ['$eq', '$in'],
    FeatureRolloutInterface::ATTR_SCOPE_LEVEL => ['$eq', '$in'],
    FeatureRolloutInterface::ATTR_PERCENTAGE  => ['$eq', '$gte', '$lte', '$between'],
])]
final class EloquentFeatureRolloutRepository extends Repository implements FeatureRolloutRepositoryInterface
{
    /**
     * {@inheritDoc}
     *
     * Filters `(tenant_id, flag, scope_level)` (unique index) and
     * applies the `(starts_at, ends_at)` window against `now()`.
     * Tenant scope is enforced automatically by `BelongsToTenant`.
     */
    public function findActiveFor(string $flag, string $scopeLevel): ?FeatureRollout
    {
        $now = Carbon::now();

        /** @var FeatureRollout|null $row */
        $row = $this->query()
            ->where(FeatureRolloutInterface::ATTR_FLAG, $flag)
            ->where(FeatureRolloutInterface::ATTR_SCOPE_LEVEL, $scopeLevel)
            ->where(function ($query) use ($now): void {
                $query->whereNull(FeatureRolloutInterface::ATTR_STARTS_AT)
                    ->orWhere(FeatureRolloutInterface::ATTR_STARTS_AT, '<=', $now);
            })
            ->where(function ($query) use ($now): void {
                $query->whereNull(FeatureRolloutInterface::ATTR_ENDS_AT)
                    ->orWhere(FeatureRolloutInterface::ATTR_ENDS_AT, '>', $now);
            })
            ->first();

        return $row;
    }
}
