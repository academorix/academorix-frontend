<?php

declare(strict_types=1);

namespace Stackra\Compliance\Repositories;

use Stackra\Compliance\Contracts\Data\ConsentRecordInterface;
use Stackra\Compliance\Contracts\Repositories\ConsentRecordRepositoryInterface;
use Stackra\Compliance\Models\ConsentRecord;
use Stackra\Crud\Attributes\AsRepository;
use Stackra\Crud\Attributes\Cacheable;
use Stackra\Crud\Attributes\Filterable;
use Stackra\Crud\Attributes\UseModel;
use Stackra\Crud\Repositories\Repository;
use Illuminate\Support\Collection;

/**
 * Eloquent implementation of
 * {@see ConsentRecordRepositoryInterface}.
 *
 * @category Compliance
 *
 * @since    0.1.0
 */
#[AsRepository]
#[UseModel(ConsentRecordInterface::class)]
#[Cacheable(ttl: 300, tags: true)]
#[Filterable([
    ConsentRecordInterface::ATTR_TENANT_ID    => ['$eq', '$in'],
    ConsentRecordInterface::ATTR_SUBJECT_TYPE => ['$eq'],
    ConsentRecordInterface::ATTR_SUBJECT_ID   => ['$eq'],
    ConsentRecordInterface::ATTR_CATEGORY_KEY => ['$eq', '$in'],
    ConsentRecordInterface::ATTR_DECISION     => ['$eq'],
])]
final class EloquentConsentRecordRepository extends Repository implements ConsentRecordRepositoryInterface
{
    /**
     * {@inheritDoc}
     */
    public function findLatestFor(string $subjectType, string $subjectId, string $categoryKey): ?ConsentRecord
    {
        /** @var ConsentRecord|null $row */
        $row = $this->query()
            ->where(ConsentRecordInterface::ATTR_SUBJECT_TYPE, $subjectType)
            ->where(ConsentRecordInterface::ATTR_SUBJECT_ID, $subjectId)
            ->where(ConsentRecordInterface::ATTR_CATEGORY_KEY, $categoryKey)
            ->orderByDesc(ConsentRecordInterface::ATTR_RECORDED_AT)
            ->first();

        return $row;
    }

    /**
     * {@inheritDoc}
     */
    public function findBySubject(string $subjectType, string $subjectId): Collection
    {
        /** @var Collection<int, ConsentRecord> $rows */
        $rows = $this->query()
            ->where(ConsentRecordInterface::ATTR_SUBJECT_TYPE, $subjectType)
            ->where(ConsentRecordInterface::ATTR_SUBJECT_ID, $subjectId)
            ->orderByDesc(ConsentRecordInterface::ATTR_RECORDED_AT)
            ->get();

        return $rows;
    }
}
