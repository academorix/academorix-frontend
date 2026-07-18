<?php

declare(strict_types=1);

namespace Academorix\Tenancy\Actions\Platform;

use Academorix\Authorization\Attributes\RequirePermission;
use Academorix\Routing\Attributes\AsAction;
use Academorix\Routing\Attributes\Middleware;
use Academorix\Routing\Attributes\Post;
use Academorix\Routing\Concerns\AsController;
use Academorix\Tenancy\Actions\Support\ProvisionTenant;
use Academorix\Tenancy\Data\Requests\CreateTenantRequestData;
use Academorix\Tenancy\Data\TenantData;
use Academorix\Tenancy\Enums\TenancyPermission;

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
