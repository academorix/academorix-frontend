<?php

declare(strict_types=1);

namespace Stackra\Tenancy\Actions\Central;

use Stackra\Routing\Attributes\AsAction;
use Stackra\Routing\Attributes\Middleware;
use Stackra\Routing\Attributes\Post;
use Stackra\Routing\Concerns\AsController;
use Stackra\Tenancy\Contracts\Repositories\TenantRepositoryInterface;
use Stackra\Tenancy\Data\MyTenantEntryData;
use Stackra\Tenancy\Data\Requests\FindTenantsRequestData;
use Stackra\Tenancy\Models\Tenant;
use Spatie\LaravelData\DataCollection;

/**
 * `POST /api/v1/auth/find-tenants` — central-host self-service.
 *
 * User forgets which tenant they belong to. Return the tenants
 * their email is a member of + dispatch a magic-link email.
 *
 * @category Tenancy
 *
 * @since    0.1.0
 */
#[AsAction(name: 'tenants.central.find')]
#[Post('/api/v1/auth/find-tenants')]
#[Middleware(['api', 'platform.domain', 'throttle:auth'])]
final class FindTenants
{
    use AsController;

    public function __construct(
        private readonly TenantRepositoryInterface $tenants,
    ) {
    }

    /**
     * @return DataCollection<int, MyTenantEntryData>
     */
    public function __invoke(FindTenantsRequestData $data): DataCollection
    {
        $rows = $this->tenants
            ->findByMemberEmail($data->email)
            ->map(static fn (Tenant $t): MyTenantEntryData => MyTenantEntryData::fromModel($t));

        return new DataCollection(MyTenantEntryData::class, $rows);
    }
}
