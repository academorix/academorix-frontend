<?php

declare(strict_types=1);

namespace Academorix\Tenancy\Actions\Central;

use Academorix\Routing\Attributes\AsAction;
use Academorix\Routing\Attributes\Middleware;
use Academorix\Routing\Attributes\Post;
use Academorix\Routing\Concerns\AsController;
use Academorix\Tenancy\Contracts\Repositories\TenantRepositoryInterface;
use Academorix\Tenancy\Data\MyTenantEntryData;
use Academorix\Tenancy\Data\Requests\FindTenantsRequestData;
use Academorix\Tenancy\Models\Tenant;
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
