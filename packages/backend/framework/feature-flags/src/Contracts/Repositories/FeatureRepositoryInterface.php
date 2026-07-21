<?php

declare(strict_types=1);

namespace Stackra\FeatureFlags\Contracts\Repositories;

use Stackra\Crud\Contracts\RepositoryInterface;
use Stackra\FeatureFlags\Models\Feature;
use Stackra\FeatureFlags\Registry\FeatureDefinition;
use Stackra\FeatureFlags\Repositories\EloquentFeatureRepository;
use Illuminate\Container\Attributes\Bind;
use Illuminate\Container\Attributes\Scoped;
use Illuminate\Database\Eloquent\Collection;

/**
 * Repository contract for {@see Feature} — the flag catalog.
 *
 * Extends the CRUD `RepositoryInterface` so consumers reach every
 * base operation (`find`, `paginate`, `create`, `update`, `delete`,
 * `factory`) through this contract. Adds the two discovery-time
 * finders `FeatureFlagDiscovery` and `FeatureFlagRegistry` need.
 * Platform-scoped — no tenant filter applies.
 *
 * @extends RepositoryInterface<Feature>
 *
 * @category FeatureFlags
 *
 * @since    0.1.0
 */
#[Bind(EloquentFeatureRepository::class)]
#[Scoped]
interface FeatureRepositoryInterface extends RepositoryInterface
{
    /**
     * Fetch a catalog row by its natural key.
     *
     * @param  string  $name  Stable dot-separated flag identifier.
     * @return Feature|null   The matching row, or null when unknown.
     */
    public function findByName(string $name): ?Feature;

    /**
     * Return every catalog row ordered by `name` ascending.
     *
     * Called by `FeatureFlagRegistry` at boot and by the admin
     * `ListFlags` action to render the catalog.
     *
     * @return Collection<int, Feature>
     */
    public function allOrdered(): Collection;

    /**
     * Idempotent upsert of every discovered flag definition.
     *
     * Called on every `package:discover` — safe to invoke on
     * every deploy. Definitions absent from `$definitions` are
     * NOT removed here; retiring a flag class is a separate
     * concern handled by the tombstoning pass in
     * `FeatureFlagDiscovery`.
     *
     * @param  array<int, FeatureDefinition>  $definitions  Registry entries to upsert.
     * @return void
     */
    public function upsertMany(array $definitions): void;
}
