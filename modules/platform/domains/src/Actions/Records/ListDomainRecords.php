<?php

declare(strict_types=1);

namespace Academorix\Domains\Actions\Records;

use Academorix\Authorization\Attributes\RequirePermission;
use Academorix\Domains\Contracts\Repositories\DomainRecordRepositoryInterface;
use Academorix\Domains\Data\DomainRecordData;
use Academorix\Domains\Enums\DomainsPermission;
use Academorix\Domains\Models\Domain;
use Academorix\Domains\Models\DomainRecord;
use Academorix\Routing\Attributes\AsAction;
use Academorix\Routing\Attributes\Get;
use Academorix\Routing\Attributes\Middleware;
use Academorix\Routing\Attributes\WhereUlid;
use Academorix\Routing\Concerns\AsController;
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
