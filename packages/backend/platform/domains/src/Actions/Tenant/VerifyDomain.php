<?php

declare(strict_types=1);

namespace Stackra\Domains\Actions\Tenant;

use Stackra\Authorization\Attributes\RequirePermission;
use Stackra\Domains\Data\DomainData;
use Stackra\Domains\Enums\DomainsPermission;
use Stackra\Domains\Jobs\VerifyDomainDnsJob;
use Stackra\Domains\Models\Domain;
use Stackra\Routing\Attributes\AsAction;
use Stackra\Routing\Attributes\Middleware;
use Stackra\Routing\Attributes\Post;
use Stackra\Routing\Attributes\WhereUlid;
use Stackra\Routing\Concerns\AsController;

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
