<?php

declare(strict_types=1);

namespace Academorix\Domains\Repositories;

use Academorix\Crud\Attributes\AsRepository;
use Academorix\Crud\Attributes\Cacheable;
use Academorix\Crud\Attributes\Filterable;
use Academorix\Crud\Attributes\UseModel;
use Academorix\Crud\Repositories\Repository;
use Academorix\Domains\Contracts\Data\DomainRecordInterface;
use Academorix\Domains\Contracts\Repositories\DomainRecordRepositoryInterface;
use Academorix\Domains\Enums\DnsRecordStatus;
use Academorix\Domains\Models\DomainRecord;
use Illuminate\Support\Collection;

/**
 * Eloquent implementation of {@see DomainRecordRepositoryInterface}.
 *
 * @category Domains
 *
 * @since    0.1.0
 */
#[AsRepository]
#[UseModel(DomainRecordInterface::class)]
#[Cacheable(ttl: 30, tags: true)]
#[Filterable([
    DomainRecordInterface::ATTR_DOMAIN_ID => ['$eq', '$in'],
    DomainRecordInterface::ATTR_KIND      => ['$eq', '$in'],
    DomainRecordInterface::ATTR_STATUS    => ['$eq', '$in'],
])]
final class EloquentDomainRecordRepository extends Repository implements DomainRecordRepositoryInterface
{
    /**
     * {@inheritDoc}
     */
    public function findByDomain(string $domainId): Collection
    {
        /** @var Collection<int, DomainRecord> $rows */
        $rows = $this->query()
            ->where(DomainRecordInterface::ATTR_DOMAIN_ID, $domainId)
            ->orderBy(DomainRecordInterface::ATTR_KIND)
            ->orderBy(DomainRecordInterface::ATTR_NAME)
            ->get();

        return $rows;
    }

    /**
     * {@inheritDoc}
     */
    public function allMatchingForDomain(string $domainId): bool
    {
        $total = $this->query()
            ->where(DomainRecordInterface::ATTR_DOMAIN_ID, $domainId)
            ->count();

        if ($total === 0) {
            return false;
        }

        $matching = $this->query()
            ->where(DomainRecordInterface::ATTR_DOMAIN_ID, $domainId)
            ->where(DomainRecordInterface::ATTR_STATUS, DnsRecordStatus::Matches->value)
            ->count();

        return $matching === $total;
    }
}
