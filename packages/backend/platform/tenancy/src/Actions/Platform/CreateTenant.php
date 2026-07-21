<?php

declare(strict_types=1);

namespace Stackra\Tenancy\Actions\Platform;

use Stackra\Authorization\Attributes\RequirePermission;
use Stackra\Routing\Attributes\AsAction;
use Stackra\Routing\Attributes\Middleware;
use Stackra\Routing\Attributes\Post;
use Stackra\Routing\Concerns\AsController;
use Stackra\Tenancy\Actions\Support\ProvisionTenant;
use Stackra\Tenancy\Data\Requests\CreateTenantRequestData;
use Stackra\Tenancy\Data\TenantData;
use Stackra\Tenancy\Enums\TenancyPermission;

/**
 * `POST /api/v1/platform/tenants` — platform-admin provisions a
 * tenant on behalf of a customer (bypasses self-service).
 *
 * @category Tenancy
 *
 * @since    0.1.0
 */
#[AsAction(name: 'tenants.platform.create')]
#[Post('/api/v1/platform/tenants')]
#[Middleware(['api', 'auth:platform_admin'])]
#[RequirePermission(TenancyPermission::Manage)]
final class CreateTenant
{
    use AsController;

    public function __construct(
        private readonly ProvisionTenant $provision,
    ) {
    }

    public function __invoke(CreateTenantRequestData $data): TenantData
    {
        return TenantData::fromModel($this->provision->handle($data));
    }
}
