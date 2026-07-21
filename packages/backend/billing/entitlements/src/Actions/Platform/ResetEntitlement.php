<?php

declare(strict_types=1);

namespace Stackra\Entitlements\Actions\Platform;

use Stackra\Authorization\Attributes\RequirePermission;
use Stackra\Entitlements\Contracts\Repositories\EntitlementRepositoryInterface;
use Stackra\Entitlements\Data\EntitlementData;
use Stackra\Entitlements\Data\Requests\ResetEntitlementRequestData;
use Stackra\Entitlements\Enums\EntitlementsPermission;
use Stackra\Entitlements\Exceptions\EntitlementNotFoundException;
use Stackra\Entitlements\Jobs\ResetPeriodicUsageJob;
use Stackra\Routing\Attributes\AsAction;
use Stackra\Routing\Attributes\Middleware;
use Stackra\Routing\Attributes\Post;
use Stackra\Routing\Concerns\AsController;

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
