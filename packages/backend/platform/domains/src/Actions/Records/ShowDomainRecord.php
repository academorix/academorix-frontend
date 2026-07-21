<?php

declare(strict_types=1);

namespace Stackra\Domains\Actions\Records;

use Stackra\Authorization\Attributes\RequirePermission;
use Stackra\Domains\Data\DomainRecordData;
use Stackra\Domains\Enums\DomainsPermission;
use Stackra\Domains\Models\DomainRecord;
use Stackra\Routing\Attributes\AsAction;
use Stackra\Routing\Attributes\Get;
use Stackra\Routing\Attributes\Middleware;
use Stackra\Routing\Attributes\WhereUlid;
use Stackra\Routing\Concerns\AsController;

/**
 * `GET /api/v1/tenant/domain-records/{record}` — read one record.
 *
 * @category Domains
 *
 * @since    0.1.0
 */
#[AsAction(name: 'domains.records.show')]
#[Get('/api/v1/tenant/domain-records/{record}')]
#[Middleware(['api', 'resolve.tenant', 'auth:sanctum', 'tenant.user'])]
#[WhereUlid('record')]
#[RequirePermission(DomainsPermission::ManageOwn)]
final class ShowDomainRecord
{
    use AsController;

    public function __invoke(DomainRecord $record): DomainRecordData
    {
        return DomainRecordData::fromModel($record);
    }
}
