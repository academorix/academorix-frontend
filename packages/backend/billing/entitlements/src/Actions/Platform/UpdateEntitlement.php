<?php

declare(strict_types=1);

namespace Stackra\Entitlements\Actions\Platform;

use Stackra\Authorization\Attributes\RequirePermission;
use Stackra\Entitlements\Contracts\Data\EntitlementInterface;
use Stackra\Entitlements\Contracts\Repositories\EntitlementRepositoryInterface;
use Stackra\Entitlements\Data\EntitlementData;
use Stackra\Entitlements\Data\Requests\UpdateEntitlementRequestData;
use Stackra\Entitlements\Enums\EntitlementsPermission;
use Stackra\Entitlements\Enums\EntitlementSource;
use Stackra\Entitlements\Exceptions\EntitlementNotFoundException;
use Stackra\Routing\Attributes\AsAction;
use Stackra\Routing\Attributes\Middleware;
use Stackra\Routing\Attributes\Patch;
use Stackra\Routing\Concerns\AsController;

/**
 * `PATCH /api/v1/platform/entitlements/{tenant}/{key}` — platform
 * admin overrides an entitlement's `value` for one tenant.
 *
 * The observer fires `EntitlementOverridden` after the write so the
 * override lands in the audit trail with an accurate old → new diff.
 * Source flips to `override` — the plan syncer never overwrites it.
 *
 * @category Entitlements
 *
 * @since    0.1.0
 */
#[AsAction(name: 'entitlements.platform.update')]
#[Patch('/api/v1/platform/entitlements/{tenant}/{key}')]
#[Middleware(['api', 'auth:platform_admin'])]
#[RequirePermission(EntitlementsPermission::Manage)]
final class UpdateEntitlement
{
    use AsController;

    public function __construct(
        private readonly EntitlementRepositoryInterface $entitlements,
    ) {
    }

    public function __invoke(
        string $tenant,
        string $key,
        UpdateEntitlementRequestData $data,
    ): EntitlementData {
        $entitlement = $this->entitlements->findByKey($tenant, $key);
        if ($entitlement === null) {
            throw EntitlementNotFoundException::forKey($tenant, $key);
        }

        $entitlement->update([
            EntitlementInterface::ATTR_VALUE  => $data->value,
            EntitlementInterface::ATTR_SOURCE => EntitlementSource::Override->value,
            EntitlementInterface::ATTR_NOTES  => $data->notes,
        ]);

        return EntitlementData::fromModel($entitlement->refresh());
    }
}
