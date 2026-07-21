<?php

declare(strict_types=1);

namespace Stackra\Domains\Actions\Records;

use Stackra\Authorization\Attributes\RequirePermission;
use Stackra\Domains\Contracts\Repositories\DomainRecordRepositoryInterface;
use Stackra\Domains\Data\DomainRecordData;
use Stackra\Domains\Enums\DomainsPermission;
use Stackra\Domains\Models\Domain;
use Stackra\Domains\Models\DomainRecord;
use Stackra\Routing\Attributes\AsAction;
use Stackra\Routing\Attributes\Get;
use Stackra\Routing\Attributes\Middleware;
use Stackra\Routing\Attributes\WhereUlid;
use Stackra\Routing\Concerns\AsController;
use Spatie\LaravelData\DataCollection;

/**
 * `GET /api/v1/tenant/domains/{domain}/records` — the expected DNS
 * records for a domain (what to configure at the customer's DNS
 * provider).
 *
 * @category Domains
 *
 * @since    0.1.0
 */
#[AsAction(name: 'domains.records.list')]
#[Get('/api/v1/tenant/domains/{domain}/records')]
#[Middleware(['api', 'resolve.tenant', 'auth:sanctum', 'tenant.user'])]
#[WhereUlid('domain')]
#[RequirePermission(DomainsPermission::ManageOwn)]
final class ListDomainRecords
{
    use AsController;

    public function __construct(
        private readonly DomainRecordRepositoryInterface $records,
    ) {
    }

    /**
     * @return DataCollection<int, DomainRecordData>
     */
    public function __invoke(Domain $domain): DataCollection
    {
        $rows = $this->records
            ->findByDomain((string) $domain->getKey())
            ->map(static fn (DomainRecord $r): DomainRecordData => DomainRecordData::fromModel($r));

        return new DataCollection(DomainRecordData::class, $rows);
    }
}
