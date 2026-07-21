<?php

declare(strict_types=1);

namespace Stackra\Entitlements\Actions\Platform;

use Stackra\Authorization\Attributes\RequirePermission;
use Stackra\Entitlements\Contracts\Repositories\EntitlementRepositoryInterface;
use Stackra\Entitlements\Data\EntitlementData;
use Stackra\Entitlements\Enums\EntitlementsPermission;
use Stackra\Entitlements\Exceptions\EntitlementNotFoundException;
use Stackra\Routing\Attributes\AsAction;
use Stackra\Routing\Attributes\Get;
use Stackra\Routing\Attributes\Middleware;
use Stackra\Routing\Concerns\AsController;

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
