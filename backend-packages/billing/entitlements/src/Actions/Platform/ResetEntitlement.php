<?php

declare(strict_types=1);

namespace Academorix\Entitlements\Actions\Platform;

use Academorix\Authorization\Attributes\RequirePermission;
use Academorix\Entitlements\Contracts\Repositories\EntitlementRepositoryInterface;
use Academorix\Entitlements\Data\EntitlementData;
use Academorix\Entitlements\Data\Requests\ResetEntitlementRequestData;
use Academorix\Entitlements\Enums\EntitlementsPermission;
use Academorix\Entitlements\Exceptions\EntitlementNotFoundException;
use Academorix\Entitlements\Jobs\ResetPeriodicUsageJob;
use Academorix\Routing\Attributes\AsAction;
use Academorix\Routing\Attributes\Middleware;
use Academorix\Routing\Attributes\Post;
use Academorix\Routing\Concerns\AsController;

/**
 * `POST /api/v1/platform/entitlements/{tenant}/reset/{key}` — platform
 * admin manually resets a pool-kind entitlement's period counter.
 *
 * Dispatches {@see ResetPeriodicUsageJob} so the actual reset commits
 * asynchronously with retries.
 *
 * @category Entitlements
 *
 * @since    0.1.0
 */
#[AsAction(name: 'entitlements.platform.reset')]
#[Post('/api/v1/platform/entitlements/{tenant}/reset/{key}')]
#[Middleware(['api', 'auth:platform_admin'])]
#[RequirePermission(EntitlementsPermission::Manage)]
final class ResetEntitlement
{
    use AsController;

    public function __construct(
        private readonly EntitlementRepositoryInterface $entitlements,
    ) {
    }

    public function __invoke(
        string $tenant,
        string $key,
        ResetEntitlementRequestData $data,
    ): EntitlementData {
        $entitlement = $this->entitlements->findByKey($tenant, $key);
        if ($entitlement === null) {
            throw EntitlementNotFoundException::forKey($tenant, $key);
        }

        ResetPeriodicUsageJob::dispatch((string) $entitlement->getKey());

        return EntitlementData::fromModel($entitlement);
    }
}
