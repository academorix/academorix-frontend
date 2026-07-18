<?php

declare(strict_types=1);

namespace Academorix\FeatureFlags\Contracts\Repositories;

use Academorix\Crud\Contracts\RepositoryInterface;
use Academorix\FeatureFlags\Models\FeatureRollout;
use Academorix\FeatureFlags\Repositories\EloquentFeatureRolloutRepository;
use Illuminate\Container\Attributes\Bind;
use Illuminate\Container\Attributes\Scoped;

/**
 * Repository contract for {@see FeatureRollout}.
 *
 * Extends the CRUD `RepositoryInterface` so consumers reach every
 * base operation through this contract. Adds the resolver's
 * hot-path finder. Tenant-scoped via `BelongsToTenant` on the model.
 *
 * @extends RepositoryInterface<FeatureRollout>
 *
 * @category FeatureFlags
 *
 * @since    0.1.0
 */
#[Bind(EloquentFeatureRolloutRepository::class)]
#[Scoped]
interface FeatureRolloutRepositoryInterface extends RepositoryInterface
{
    /**
     * Return the active rollout row for `$flag` at `$scopeLevel`.
     *
     * Applies the `(starts_at, ends_at)` window filter — rows
     * outside the window are excluded. The DB-level unique index
     * on `(tenant_id, flag, scope_level)` guarantees at most one
     * row per call.
     *
     * @param  string  $flag        Normalised flag identifier.
     * @param  string  $scopeLevel  `scope_definitions.slug` — one level per call.
     * @return FeatureRollout|null  The single active row, or null when none applies.
     */
    public function findActiveFor(string $flag, string $scopeLevel): ?FeatureRollout;
}
