<?php

declare(strict_types=1);

namespace Academorix\Transfer\Repositories;

use Academorix\Crud\Attributes\AsRepository;
use Academorix\Crud\Attributes\Cacheable;
use Academorix\Crud\Attributes\Filterable;
use Academorix\Crud\Attributes\UseModel;
use Academorix\Crud\Repositories\Repository;
use Academorix\Transfer\Contracts\Data\XferMappingProfileInterface;
use Academorix\Transfer\Contracts\Repositories\XferMappingProfileRepositoryInterface;
use Academorix\Transfer\Models\XferMappingProfile;
use Illuminate\Support\Collection;

/**
 * Eloquent implementation of {@see XferMappingProfileRepositoryInterface}.
 *
 * @category Transfer
 *
 * @since    0.1.0
 */
#[AsRepository]
#[UseModel(XferMappingProfileInterface::class)]
#[Cacheable(ttl: 300, tags: true)]
#[Filterable([
    XferMappingProfileInterface::ATTR_TENANT_ID  => ['$eq'],
    XferMappingProfileInterface::ATTR_OWNER_ID   => ['$eq'],
    XferMappingProfileInterface::ATTR_ENTITY_KEY => ['$eq', '$in'],
    XferMappingProfileInterface::ATTR_IS_SHARED  => ['$eq'],
])]
final class EloquentXferMappingProfileRepository extends Repository implements XferMappingProfileRepositoryInterface
{
    /**
     * {@inheritDoc}
     */
    public function findByOwner(string $ownerId): Collection
    {
        /** @var Collection<int, XferMappingProfile> $rows */
        $rows = $this->query()
            ->where(XferMappingProfileInterface::ATTR_OWNER_ID, $ownerId)
            ->orderBy(XferMappingProfileInterface::ATTR_NAME)
            ->get();

        return $rows;
    }

    /**
     * {@inheritDoc}
     */
    public function findVisibleTo(string $tenantId, string $ownerId): Collection
    {
        /** @var Collection<int, XferMappingProfile> $rows */
        $rows = $this->query()
            ->where(XferMappingProfileInterface::ATTR_TENANT_ID, $tenantId)
            ->where(function ($query) use ($ownerId): void {
                $query
                    ->where(XferMappingProfileInterface::ATTR_OWNER_ID, $ownerId)
                    ->orWhere(XferMappingProfileInterface::ATTR_IS_SHARED, true);
            })
            ->orderBy(XferMappingProfileInterface::ATTR_NAME)
            ->get();

        return $rows;
    }
}
