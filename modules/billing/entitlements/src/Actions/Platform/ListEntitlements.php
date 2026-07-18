<?php

declare(strict_types=1);

namespace Academorix\Entitlements\Actions\Platform;

use Academorix\Authorization\Attributes\RequirePermission;
use Academorix\Entitlements\Contracts\Repositories\EntitlementRepositoryInterface;
use Academorix\Entitlements\Data\EntitlementData;
use Academorix\Entitlements\Enums\EntitlementsPermission;
use Academorix\Entitlements\Models\Entitlement;
use Academorix\Routing\Attributes\AsAction;
use Academorix\Routing\Attributes\Get;
use Academorix\Routing\Attributes\Middleware;
use Academorix\Routing\Concerns\AsController;
use Spatie\LaravelData\DataCollection;

/**
 * `GET /api/v1/platform/entitlements` — cross-tenant entitlement
 * listing for platform admins.
 *
 * Paginated at the repository layer — the wire format is a
 * `DataCollection` for readability, but production consumers should
 * paginate via `?page=` params.
 *
 * @category Entitlements
 *
 * @since    0.1.0
 */
#[AsAction(name: 'entitlements.platform.list')]
#[Get('/api/v1/platform/entitlements')]
#[Middleware(['api', 'auth:platform_admin'])]
#[RequirePermission(EntitlementsPermission::ViewAll)]
final class ListEntitlements
{
    use AsController;

    public function __construct(
        private readonly EntitlementRepositoryInterface $entitlements,
    ) {
    }

    /**
     * @return DataCollection<int, EntitlementData>
     */
    public function __invoke(): DataCollection
    {
        $rows = $this->entitlements
            ->paginate(1000)
            ->getCollection()
            ->map(static fn (Entitlement $e): EntitlementData => EntitlementData::fromModel($e));

        return new DataCollection(EntitlementData::class, $rows);
    }
}
