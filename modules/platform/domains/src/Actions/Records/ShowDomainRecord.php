<?php

declare(strict_types=1);

namespace Academorix\Domains\Actions\Records;

use Academorix\Authorization\Attributes\RequirePermission;
use Academorix\Domains\Data\DomainRecordData;
use Academorix\Domains\Enums\DomainsPermission;
use Academorix\Domains\Models\DomainRecord;
use Academorix\Routing\Attributes\AsAction;
use Academorix\Routing\Attributes\Get;
use Academorix\Routing\Attributes\Middleware;
use Academorix\Routing\Attributes\WhereUlid;
use Academorix\Routing\Concerns\AsController;

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
