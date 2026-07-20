<?php

declare(strict_types=1);

namespace Academorix\Versioning\Contracts\Repositories;

use Academorix\Crud\Contracts\RepositoryInterface;
use Academorix\Versioning\Enums\DeprecationSurface;
use Academorix\Versioning\Models\DeprecationNotice;
use Academorix\Versioning\Repositories\EloquentDeprecationNoticeRepository;
use Illuminate\Container\Attributes\Bind;
use Illuminate\Support\Collection;

/**
 * Repository contract for {@see DeprecationNotice}.
 *
 * Adds the two read-heavy finders the deprecation service + tenant
 * catalog use on top of the base CRUD surface.
 *
 * @extends RepositoryInterface<DeprecationNotice>
 *
 * @category Versioning
 *
 * @since    0.1.0
 */
#[Bind(EloquentDeprecationNoticeRepository::class)]
interface DeprecationNoticeRepositoryInterface extends RepositoryInterface
{
    /**
     * Every notice attached to a version (any state).
     *
     * @return Collection<int, DeprecationNotice>
     */
    public function findByVersion(string $apiVersionId): Collection;

    /**
     * Every active notice targeting a surface. `$surface` matches
     * exactly OR falls back to notices with surface = `all`.
     *
     * @return Collection<int, DeprecationNotice>
     */
    public function findActiveForSurface(DeprecationSurface $surface): Collection;
}
