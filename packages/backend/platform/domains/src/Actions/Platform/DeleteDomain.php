<?php

declare(strict_types=1);

namespace Academorix\Domains\Actions\Platform;

use Academorix\Authorization\Attributes\RequirePermission;
use Academorix\Domains\Enums\DomainsPermission;
use Academorix\Domains\Models\Domain;
use Academorix\Routing\Attributes\AsAction;
use Academorix\Routing\Attributes\Delete;
use Academorix\Routing\Attributes\Middleware;
use Academorix\Routing\Attributes\WhereUlid;
use Academorix\Routing\Concerns\AsController;
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
