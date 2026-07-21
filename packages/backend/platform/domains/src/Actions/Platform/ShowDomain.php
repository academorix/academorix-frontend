<?php

declare(strict_types=1);

namespace Stackra\Domains\Actions\Platform;

use Stackra\Authorization\Attributes\RequirePermission;
use Stackra\Domains\Data\DomainData;
use Stackra\Domains\Enums\DomainsPermission;
use Stackra\Domains\Models\Domain;
use Stackra\Routing\Attributes\AsAction;
use Stackra\Routing\Attributes\Get;
use Stackra\Routing\Attributes\Middleware;
use Stackra\Routing\Attributes\WhereUlid;
use Stackra\Routing\Concerns\AsController;

/**
 * `GET /api/v1/platform/domains/{domain}` — read one domain.
 *
 * @category Domains
 *
 * @since    0.1.0
 */
#[AsAction(name: 'domains.platform.show')]
#[Get('/api/v1/platform/domains/{domain}')]
#[Middleware(['api', 'auth:platform_admin'])]
#[WhereUlid('domain')]
#[RequirePermission(DomainsPermission::View)]
final class ShowDomain
{
    use AsController;

    public function __invoke(Domain $domain): DomainData
    {
        return DomainData::fromModel($domain);
    }
}
