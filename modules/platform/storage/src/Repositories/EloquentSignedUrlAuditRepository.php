<?php

declare(strict_types=1);

namespace Academorix\Storage\Repositories;

use Academorix\Crud\Attributes\AsRepository;
use Academorix\Crud\Attributes\Cacheable;
use Academorix\Crud\Attributes\Filterable;
use Academorix\Crud\Attributes\UseModel;
use Academorix\Crud\Repositories\Repository;
use Academorix\Storage\Contracts\Data\SignedUrlAuditInterface;
use Academorix\Storage\Contracts\Repositories\SignedUrlAuditRepositoryInterface;
use Academorix\Storage\Models\SignedUrlAudit;
use Illuminate\Support\Collection;

/**
 * Eloquent implementation of {@see SignedUrlAuditRepositoryInterface}.
 *
 * @category Storage
 *
 * @since    0.1.0
 */
#[AsRepository]
#[UseModel(SignedUrlAuditInterface::class)]
#[Cacheable(ttl: 60, tags: true)]
#[Filterable([
    SignedUrlAuditInterface::ATTR_TENANT_ID         => ['$eq', '$in'],
    SignedUrlAuditInterface::ATTR_FILE_ID           => ['$eq', '$in'],
    SignedUrlAuditInterface::ATTR_PURPOSE           => ['$eq', '$in'],
    SignedUrlAuditInterface::ATTR_ISSUED_TO_USER_ID => ['$eq', '$in'],
    SignedUrlAuditInterface::ATTR_ISSUED_BY_USER_ID => ['$eq', '$in'],
])]
final class EloquentSignedUrlAuditRepository extends Repository implements SignedUrlAuditRepositoryInterface
{
    /**
     * {@inheritDoc}
     */
    public function findBySignatureHash(string $hash): ?SignedUrlAudit
    {
        /** @var SignedUrlAudit|null $row */
        $row = $this->query()
            ->withoutGlobalScopes()
            ->where(SignedUrlAuditInterface::ATTR_SIGNATURE_HASH, $hash)
            ->first();

        return $row;
    }

    /**
     * {@inheritDoc}
     */
    public function findExpiredUnrevoked(\DateTimeInterface $now): Collection
    {
        /** @var Collection<int, SignedUrlAudit> $rows */
        $rows = $this->query()
            ->withoutGlobalScopes()
            ->whereNull(SignedUrlAuditInterface::ATTR_REVOKED_AT)
            ->where(SignedUrlAuditInterface::ATTR_EXPIRES_AT, '<=', $now)
            ->orderBy(SignedUrlAuditInterface::ATTR_EXPIRES_AT)
            ->get();

        return $rows;
    }

    /**
     * {@inheritDoc}
     */
    public function findByFile(string $fileId): Collection
    {
        /** @var Collection<int, SignedUrlAudit> $rows */
        $rows = $this->query()
            ->where(SignedUrlAuditInterface::ATTR_FILE_ID, $fileId)
            ->orderByDesc(SignedUrlAuditInterface::ATTR_ISSUED_AT)
            ->get();

        return $rows;
    }
}
