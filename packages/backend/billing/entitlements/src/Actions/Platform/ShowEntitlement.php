<?php

declare(strict_types=1);

namespace Academorix\Entitlements\Actions\Platform;

use Academorix\Authorization\Attributes\RequirePermission;
use Academorix\Entitlements\Contracts\Repositories\EntitlementRepositoryInterface;
use Academorix\Entitlements\Data\EntitlementData;
use Academorix\Entitlements\Enums\EntitlementsPermission;
use Academorix\Entitlements\Exceptions\EntitlementNotFoundException;
use Academorix\Routing\Attributes\AsAction;
use Academorix\Routing\Attributes\Get;
use Academorix\Routing\Attributes\Middleware;
use Academorix\Routing\Concerns\AsController;

/**
 * `GET /api/v1/platform/entitlements/{tenant}/{key}` — one specific
 * entitlement on any tenant.
 *
 * @category Entitlements
 *
 * @since    0.1.0
 */
#[AsAction(name: 'entitlements.platform.show')]
#[Get('/api/v1/platform/entitlements/{tenant}/{key}')]
#[Middleware(['api', 'auth:platform_admin'])]
#[RequirePermission(EntitlementsPermission::ViewAll)]
final class ShowEntitlement
{
    use AsController;

    public function __construct(
        private readonly EntitlementRepositoryInterface $entitlements,
    ) {
    }

    public function __invoke(string $tenant, string $key): EntitlementData
    {
        $entitlement = $this->entitlements->findByKey($tenant, $key);
        if ($entitlement === null) {
            throw EntitlementNotFoundException::forKey($tenant, $key);
        }

        return EntitlementData::fromModel($entitlement);
    }
}
