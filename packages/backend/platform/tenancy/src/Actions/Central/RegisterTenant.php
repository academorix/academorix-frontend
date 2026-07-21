<?php

declare(strict_types=1);

namespace Stackra\Tenancy\Actions\Central;

use Stackra\Application\Contracts\Repositories\ApplicationRepositoryInterface;
use Stackra\Routing\Attributes\AsAction;
use Stackra\Routing\Attributes\Middleware;
use Stackra\Routing\Attributes\Post;
use Stackra\Routing\Concerns\AsController;
use Stackra\Tenancy\Actions\Support\ProvisionTenant;
use Stackra\Tenancy\Data\Requests\CreateTenantRequestData;
use Stackra\Tenancy\Data\Requests\RegisterTenantRequestData;
use Stackra\Tenancy\Data\TenantData;
use Stackra\Tenancy\Jobs\ProvisionTenantJob;

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
