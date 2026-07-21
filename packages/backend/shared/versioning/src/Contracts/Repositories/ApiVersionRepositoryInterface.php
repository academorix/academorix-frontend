<?php

declare(strict_types=1);

namespace Stackra\Versioning\Contracts\Repositories;

use Stackra\Crud\Contracts\RepositoryInterface;
use Stackra\Versioning\Enums\ApiVersionStatus;
use Stackra\Versioning\Models\ApiVersion;
use Stackra\Versioning\Repositories\EloquentApiVersionRepository;
use Illuminate\Container\Attributes\Bind;
use Illuminate\Support\Collection;

/**
 * Repository contract for {@see ApiVersion}.
 *
 * Adds the three domain finders the resolver + platform-admin
 * surfaces need on top of the base CRUD surface. Consumers depend on
 * this contract, not on the concrete
 * `EloquentApiVersionRepository`.
 *
 * @extends RepositoryInterface<ApiVersion>
 *
 * @category Versioning
 *
 * @since    0.1.0
 */
#[Bind(EloquentApiVersionRepository::class)]
interface ApiVersionRepositoryInterface extends RepositoryInterface
{
    /**
     * Locate a version by its slug.
     *
     * @param  string  $slug  Human-readable identifier (e.g. `v1`).
     * @return ApiVersion|null  The matching row, or `null` when none matches.
     */
    public function findBySlug(string $slug): ?ApiVersion;

    /**
     * Every version that's `released` or `deprecated` — the set the
     * public catalog surface renders.
     *
     * @return Collection<int, ApiVersion>
     */
    public function findActive(): Collection;

    /**
     * Every version in a specific status.
     *
     * @return Collection<int, ApiVersion>
     */
    public function findByStatus(ApiVersionStatus $status): Collection;
}
