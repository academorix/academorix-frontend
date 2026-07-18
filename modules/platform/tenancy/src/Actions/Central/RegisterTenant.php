<?php

declare(strict_types=1);

namespace Academorix\Tenancy\Actions\Central;

use Academorix\Application\Contracts\Repositories\ApplicationRepositoryInterface;
use Academorix\Routing\Attributes\AsAction;
use Academorix\Routing\Attributes\Middleware;
use Academorix\Routing\Attributes\Post;
use Academorix\Routing\Concerns\AsController;
use Academorix\Tenancy\Actions\Support\ProvisionTenant;
use Academorix\Tenancy\Data\Requests\CreateTenantRequestData;
use Academorix\Tenancy\Data\Requests\RegisterTenantRequestData;
use Academorix\Tenancy\Data\TenantData;
use Academorix\Tenancy\Jobs\ProvisionTenantJob;

/**
 * `POST /api/v1/tenants/register` — public self-serve registration
 * on the central host.
 *
 * Composes the {@see ProvisionTenant} support action + dispatches the
 * async provisioning tail (welcome email, DNS, search-index) via
 * {@see ProvisionTenantJob}.
 *
 * @category Tenancy
 *
 * @since    0.1.0
 */
#[AsAction(name: 'tenants.central.register')]
#[Post('/api/v1/tenants/register')]
#[Middleware(['api', 'platform.domain'])]
final class RegisterTenant
{
    use AsController;

    public function __construct(
        private readonly ApplicationRepositoryInterface $applications,
        private readonly ProvisionTenant $provision,
    ) {
    }

    public function __invoke(RegisterTenantRequestData $data): TenantData
    {
        // Resolve the current Application from the host — self-serve
        // requests hit the marketing central host, which maps 1:1 to
        // an Application row.
        $application = $this->applications->findByHost(\request()->getHost())
            ?? $this->applications->findDefault();

        // Fan the shape into the platform-admin DTO so the same
        // ProvisionTenant orchestrator serves both flows.
        $create = new CreateTenantRequestData(
            applicationId: (string) $application?->getKey(),
            slug: $data->slug,
            name: $data->name,
            businessType: $data->businessType,
            locale: $data->locale,
            timezone: $data->timezone,
            currency: $data->currency,
            countryCode: $data->countryCode,
            legalName: $data->legalName,
        );

        $tenant = $this->provision->handle($create);

        // Async tail — welcome email, DNS, index build.
        ProvisionTenantJob::dispatch((string) $tenant->getKey());

        return TenantData::fromModel($tenant);
    }
}
