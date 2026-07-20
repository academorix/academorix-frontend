<?php

declare(strict_types=1);

namespace Academorix\FeatureFlags\Contracts\Repositories;

use Academorix\Crud\Contracts\RepositoryInterface;
use Academorix\FeatureFlags\Models\FeatureOverride;
use Academorix\FeatureFlags\Repositories\EloquentFeatureOverrideRepository;
use Academorix\FeatureFlags\Support\ScopePath;
use Illuminate\Container\Attributes\Bind;
use Illuminate\Container\Attributes\Scoped;

/**
 * Repository contract for {@see FeatureOverride}.
 *
 * Extends the CRUD `RepositoryInterface` so consumers reach every
 * base operation through this contract. Adds the resolver's
 * hot-path finder. Every read/write is tenant-scoped via
 * `BelongsToTenant` on the model — cross-tenant queries are
 * impossible through this contract (Requirement 19.1).
 *
 * @extends RepositoryInterface<FeatureOverride>
 *
 * @category FeatureFlags
 *
 * @since    0.1.0
 */
#[Bind(EloquentFeatureOverrideRepository::class)]
#[Scoped]
interface FeatureOverrideRepositoryInterface extends RepositoryInterface
{
    /**
     * Return the deepest-matching override row for `$flag` under `$path`.
     *
     * "Deepest" means the row whose `scope_level` has the highest
     * `sort_order` on `scope_definitions` — user beats team beats
     * branch beats tenant beats global (Requirement 3.3). Expired
     * rows (past `expires_at`) are excluded.
     *
     * @param  string     $flag  Normalised flag identifier.
     * @param  ScopePath  $path  Caller's active `(scope_level, scope_value)` chain.
     * @return FeatureOverride|null  Deepest-matching row, or null when none applies.
     */
    public function findMatching(string $flag, ScopePath $path): ?FeatureOverride;
}
