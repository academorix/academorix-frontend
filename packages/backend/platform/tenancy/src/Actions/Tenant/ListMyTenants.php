<?php

declare(strict_types=1);

namespace Stackra\Tenancy\Actions\Tenant;

use Stackra\Routing\Attributes\AsAction;
use Stackra\Routing\Attributes\Get;
use Stackra\Routing\Attributes\Middleware;
use Stackra\Routing\Concerns\AsController;
use Stackra\Tenancy\Contracts\Repositories\TenantRepositoryInterface;
use Stackra\Tenancy\Data\MyTenantEntryData;
use Stackra\Tenancy\Models\Tenant;
use Illuminate\Http\Request;
use Spatie\LaravelData\DataCollection;

/**
 * `GET /api/v1/me/tenants` — every tenant the caller is a member of,
 * across every Application (tenant switcher).
 *
 * Runs on any host — the caller's identity is what drives the list;
 * the tenants themselves live on their own hosts.
 *
 * @category Tenancy
 *
 * @since    0.1.0
 */
#[AsAction(name: 'tenants.tenant.my')]
#[Get('/api/v1/me/tenants')]
#[Middleware(['api', 'auth:sanctum'])]
final class ListMyTenants
{
    use AsController;

    public function __construct(
        private readonly TenantRepositoryInterface $tenants,
    ) {
    }

    /**
     * @return DataCollection<int, MyTenantEntryData>
     */
    public function __invoke(Request $request): DataCollection
    {
        $email = (string) ($request->user()?->getAttribute('email') ?? '');

        $rows = $this->tenants->findByMemberEmail($email)
            ->map(static fn (Tenant $t): MyTenantEntryData => MyTenantEntryData::fromModel($t));

        return new DataCollection(MyTenantEntryData::class, $rows);
    }
}
