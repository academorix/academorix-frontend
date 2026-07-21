<?php

declare(strict_types=1);

namespace Stackra\Versioning\Repositories;

use Stackra\Crud\Attributes\AsRepository;
use Stackra\Crud\Attributes\Cacheable;
use Stackra\Crud\Attributes\Filterable;
use Stackra\Crud\Attributes\UseModel;
use Stackra\Crud\Repositories\Repository;
use Stackra\Versioning\Contracts\Data\DeprecationNoticeInterface;
use Stackra\Versioning\Contracts\Repositories\DeprecationNoticeRepositoryInterface;
use Stackra\Versioning\Enums\DeprecationSurface;
use Stackra\Versioning\Models\DeprecationNotice;
use Illuminate\Support\Collection;

/**
 * Eloquent implementation of
 * {@see DeprecationNoticeRepositoryInterface}.
 *
 * @category Versioning
 *
 * @since    0.1.0
 */
#[AsRepository]
#[UseModel(DeprecationNoticeInterface::class)]
#[Cacheable(ttl: 600, tags: true)]
#[Filterable([
    DeprecationNoticeInterface::ATTR_API_VERSION_ID => ['$eq', '$in'],
    DeprecationNoticeInterface::ATTR_SURFACE        => ['$eq', '$in'],
    DeprecationNoticeInterface::ATTR_IS_ACTIVE      => ['$eq'],
])]
final class EloquentDeprecationNoticeRepository extends Repository implements DeprecationNoticeRepositoryInterface
{
    /**
     * {@inheritDoc}
     */
    public function findByVersion(string $apiVersionId): Collection
    {
        /** @var Collection<int, DeprecationNotice> $rows */
        $rows = $this->query()
            ->where(DeprecationNoticeInterface::ATTR_API_VERSION_ID, $apiVersionId)
            ->orderByDesc(DeprecationNoticeInterface::ATTR_CREATED_AT)
            ->get();

        return $rows;
    }

    /**
     * {@inheritDoc}
     */
    public function findActiveForSurface(DeprecationSurface $surface): Collection
    {
        /** @var Collection<int, DeprecationNotice> $rows */
        $rows = $this->query()
            ->where(DeprecationNoticeInterface::ATTR_IS_ACTIVE, true)
            ->whereIn(DeprecationNoticeInterface::ATTR_SURFACE, [
                $surface->value,
                DeprecationSurface::All->value,
            ])
            ->orderByDesc(DeprecationNoticeInterface::ATTR_CREATED_AT)
            ->get();

        return $rows;
    }
}
