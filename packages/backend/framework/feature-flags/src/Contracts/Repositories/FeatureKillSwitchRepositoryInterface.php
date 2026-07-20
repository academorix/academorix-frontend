<?php

declare(strict_types=1);

namespace Academorix\FeatureFlags\Contracts\Repositories;

use Academorix\Crud\Contracts\RepositoryInterface;
use Academorix\FeatureFlags\Models\FeatureKillSwitch;
use Academorix\FeatureFlags\Repositories\EloquentFeatureKillSwitchRepository;
use Academorix\FeatureFlags\Support\ScopePath;
use Illuminate\Container\Attributes\Bind;
use Illuminate\Container\Attributes\Scoped;

/**
 * Repository contract for {@see FeatureKillSwitch}.
 *
 * Extends the CRUD `RepositoryInterface` so consumers reach every
 * base operation through this contract. Adds the resolver's
 * hot-path finder. Platform-scoped — no tenant filter applies.
 * Tenant targeting is encoded via the row's
 * `(scope_level, scope_value)` pair.
 *
 * @extends RepositoryInterface<FeatureKillSwitch>
 *
 * @category FeatureFlags
 *
 * @since    0.1.0
 */
#[Bind(EloquentFeatureKillSwitchRepository::class)]
#[Scoped]
interface FeatureKillSwitchRepositoryInterface extends RepositoryInterface
{
    /**
     * Return the deepest-matching active kill-switch row for `$flag` under `$path`.
     *
     * Applies the enabled-window predicate `enabled_at <= now() AND
     * (disabled_at IS NULL OR disabled_at > now())`. Deepest-wins
     * on `scope_definitions.sort_order`. NULL `scope_value` on a
     * row matches every entity at that level (Requirement 9.7).
     *
     * @param  string     $flag  Normalised flag identifier.
     * @param  ScopePath  $path  Caller's active `(scope_level, scope_value)` chain.
     * @return FeatureKillSwitch|null  Deepest-matching row, or null.
     */
    public function findMatching(string $flag, ScopePath $path): ?FeatureKillSwitch;
}
