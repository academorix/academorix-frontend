<?php

declare(strict_types=1);

namespace Stackra\Entitlements\Actions\Platform;

use Stackra\Authorization\Attributes\RequirePermission;
use Stackra\Entitlements\Contracts\Repositories\EntitlementRepositoryInterface;
use Stackra\Entitlements\Data\EntitlementData;
use Stackra\Entitlements\Enums\EntitlementsPermission;
use Stackra\Entitlements\Models\Entitlement;
use Stackra\Routing\Attributes\AsAction;
use Stackra\Routing\Attributes\Get;
use Stackra\Routing\Attributes\Middleware;
use Stackra\Routing\Concerns\AsController;
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
