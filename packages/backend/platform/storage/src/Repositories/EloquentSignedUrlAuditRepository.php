<?php

declare(strict_types=1);

namespace Stackra\Storage\Repositories;

use Stackra\Crud\Attributes\AsRepository;
use Stackra\Crud\Attributes\Cacheable;
use Stackra\Crud\Attributes\Filterable;
use Stackra\Crud\Attributes\UseModel;
use Stackra\Crud\Repositories\Repository;
use Stackra\Storage\Contracts\Data\SignedUrlAuditInterface;
use Stackra\Storage\Contracts\Repositories\SignedUrlAuditRepositoryInterface;
use Stackra\Storage\Models\SignedUrlAudit;
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
