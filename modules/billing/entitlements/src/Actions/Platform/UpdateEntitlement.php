<?php

declare(strict_types=1);

namespace Academorix\Entitlements\Actions\Platform;

use Academorix\Authorization\Attributes\RequirePermission;
use Academorix\Entitlements\Contracts\Data\EntitlementInterface;
use Academorix\Entitlements\Contracts\Repositories\EntitlementRepositoryInterface;
use Academorix\Entitlements\Data\EntitlementData;
use Academorix\Entitlements\Data\Requests\UpdateEntitlementRequestData;
use Academorix\Entitlements\Enums\EntitlementsPermission;
use Academorix\Entitlements\Enums\EntitlementSource;
use Academorix\Entitlements\Exceptions\EntitlementNotFoundException;
use Academorix\Routing\Attributes\AsAction;
use Academorix\Routing\Attributes\Middleware;
use Academorix\Routing\Attributes\Patch;
use Academorix\Routing\Concerns\AsController;

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
