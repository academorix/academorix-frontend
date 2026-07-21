<?php

declare(strict_types=1);

namespace Stackra\Domains\Actions\Platform;

use Stackra\Authorization\Attributes\RequirePermission;
use Stackra\Domains\Enums\DomainsPermission;
use Stackra\Domains\Models\Domain;
use Stackra\Routing\Attributes\AsAction;
use Stackra\Routing\Attributes\Delete;
use Stackra\Routing\Attributes\Middleware;
use Stackra\Routing\Attributes\WhereUlid;
use Stackra\Routing\Concerns\AsController;
use Illuminate\Http\Response;

/**
 * `DELETE /api/v1/platform/domains/{domain}` — soft-delete a domain.
 *
 * @category Domains
 *
 * @since    0.1.0
 */
#[AsAction(name: 'domains.platform.delete')]
#[Delete('/api/v1/platform/domains/{domain}')]
#[Middleware(['api', 'auth:platform_admin'])]
#[WhereUlid('domain')]
#[RequirePermission(DomainsPermission::Manage)]
final class DeleteDomain
{
    use AsController;

    public function __invoke(Domain $domain): Response
    {
        $domain->delete();

        return \response()->noContent();
    }
}
