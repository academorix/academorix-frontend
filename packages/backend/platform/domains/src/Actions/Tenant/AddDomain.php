<?php

declare(strict_types=1);

namespace Academorix\Domains\Actions\Tenant;

use Academorix\Authorization\Attributes\RequirePermission;
use Academorix\Domains\Contracts\Data\DomainInterface;
use Academorix\Domains\Contracts\Repositories\DomainRepositoryInterface;
use Academorix\Domains\Data\DomainData;
use Academorix\Domains\Data\Requests\CreateDomainRequestData;
use Academorix\Domains\Enums\DomainsPermission;
use Academorix\Routing\Attributes\AsAction;
use Academorix\Routing\Attributes\Middleware;
use Academorix\Routing\Attributes\Post;
use Academorix\Routing\Concerns\AsController;
use Academorix\Tenancy\Contracts\Services\TenantContextInterface;

/**
 * `POST /api/v1/tenant/domains` — tenant admin adds a custom domain.
 *
 * Application + tenant are auto-filled from the resolved context. The
 * observer generates the verification token + seeds expected records
 * + dispatches the verify job.
 *
 * @category Domains
 *
 * @since    0.1.0
 */
#[AsAction(name: 'domains.tenant.add')]
#[Post('/api/v1/tenant/domains')]
#[Middleware(['api', 'resolve.tenant', 'auth:sanctum', 'tenant.user'])]
#[RequirePermission(DomainsPermission::ManageOwn)]
final class AddDomain
{
    use AsController;

    public function __construct(
        private readonly DomainRepositoryInterface $domains,
        private readonly TenantContextInterface $tenantContext,
    ) {
    }

    public function __invoke(CreateDomainRequestData $data): DomainData
    {
        $tenant        = $this->tenantContext->currentOrFail();
        $applicationId = (string) $tenant->application_id;

        $domain = $this->domains->create([
            DomainInterface::ATTR_APPLICATION_ID      => $applicationId,
            DomainInterface::ATTR_TENANT_ID           => (string) $tenant->getKey(),
            DomainInterface::ATTR_HOST                => \strtolower($data->host),
            DomainInterface::ATTR_KIND                => $data->kind->value,
            DomainInterface::ATTR_VERIFICATION_METHOD => $data->verificationMethod?->value,
            DomainInterface::ATTR_IS_PRIMARY          => false,
        ]);

        return DomainData::fromModel($domain);
    }
}
