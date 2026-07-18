<?php

declare(strict_types=1);

namespace Academorix\Domains\Actions\Tenant;

use Academorix\Authorization\Attributes\RequirePermission;
use Academorix\Domains\Data\DomainData;
use Academorix\Domains\Enums\DomainsPermission;
use Academorix\Domains\Jobs\VerifyDomainDnsJob;
use Academorix\Domains\Models\Domain;
use Academorix\Routing\Attributes\AsAction;
use Academorix\Routing\Attributes\Middleware;
use Academorix\Routing\Attributes\Post;
use Academorix\Routing\Attributes\WhereUlid;
use Academorix\Routing\Concerns\AsController;

/**
 * `POST /api/v1/tenant/domains/{domain}/verify` — manually re-trigger
 * DNS verification.
 *
 * Dispatches the job synchronously (queue-connection=sync in tests) or
 * on the queue. Returns the current row shape immediately — the
 * verification job updates records + Domain asynchronously.
 *
 * @category Domains
 *
 * @since    0.1.0
 */
#[AsAction(name: 'domains.tenant.verify')]
#[Post('/api/v1/tenant/domains/{domain}/verify')]
#[Middleware(['api', 'resolve.tenant', 'auth:sanctum', 'tenant.user'])]
#[WhereUlid('domain')]
#[RequirePermission(DomainsPermission::ManageOwn)]
final class VerifyDomain
{
    use AsController;

    public function __invoke(Domain $domain): DomainData
    {
        VerifyDomainDnsJob::dispatch((string) $domain->getKey());

        return DomainData::fromModel($domain->refresh());
    }
}
