<?php

declare(strict_types=1);

namespace Academorix\Versioning\Repositories;

use Academorix\Crud\Attributes\AsRepository;
use Academorix\Crud\Attributes\Cacheable;
use Academorix\Crud\Attributes\Filterable;
use Academorix\Crud\Attributes\UseModel;
use Academorix\Crud\Repositories\Repository;
use Academorix\Versioning\Contracts\Data\ApiVersionInterface;
use Academorix\Versioning\Contracts\Repositories\ApiVersionRepositoryInterface;
use Academorix\Versioning\Enums\ApiVersionStatus;
use Academorix\Versioning\Models\ApiVersion;
use Illuminate\Support\Collection;

/**
 * Eloquent implementation of
 * {@see ApiVersionRepositoryInterface}.
 *
 * ## Cache strategy
 *
 * `#[Cacheable(ttl: 3600, tags: true)]` — a one-hour TTL because
 * versions are near-static (releases are cross-day events). Writes
 * cascade tag flushes via the observer, so callers see status
 * transitions immediately.
 *
 * @category Versioning
 *
 * @since    0.1.0
 */
#[AsRepository]
#[UseModel(ApiVersionInterface::class)]
#[Cacheable(ttl: 3600, tags: true)]
#[Filterable([
    ApiVersionInterface::ATTR_SLUG   => ['$eq', '$in'],
    ApiVersionInterface::ATTR_STATUS => ['$eq', '$in'],
    ApiVersionInterface::ATTR_SCHEME => ['$eq', '$in'],
])]
final class EloquentApiVersionRepository extends Repository implements ApiVersionRepositoryInterface
{
    /**
     * {@inheritDoc}
     */
    public function findBySlug(string $slug): ?ApiVersion
    {
        /** @var ApiVersion|null $row */
        $row = $this->query()
            ->where(ApiVersionInterface::ATTR_SLUG, $slug)
            ->first();

        return $row;
    }

    /**
     * {@inheritDoc}
     */
    public function findActive(): Collection
    {
        /** @var Collection<int, ApiVersion> $rows */
        $rows = $this->query()
            ->whereIn(ApiVersionInterface::ATTR_STATUS, [
                ApiVersionStatus::Released->value,
                ApiVersionStatus::Deprecated->value,
            ])
            ->orderBy(ApiVersionInterface::ATTR_SLUG)
            ->get();

        return $rows;
    }

    /**
     * {@inheritDoc}
     */
    public function findByStatus(ApiVersionStatus $status): Collection
    {
        /** @var Collection<int, ApiVersion> $rows */
        $rows = $this->query()
            ->where(ApiVersionInterface::ATTR_STATUS, $status->value)
            ->orderBy(ApiVersionInterface::ATTR_SLUG)
            ->get();

        return $rows;
    }
}
