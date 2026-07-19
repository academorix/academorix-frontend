<?php

declare(strict_types=1);

namespace Academorix\Audit\Actions\Tenant;

use Academorix\Audit\Contracts\Repositories\AuditRepositoryInterface;
use Academorix\Audit\Data\AuditData;
use Academorix\Audit\Enums\AuditPermission;
use Academorix\Audit\Models\Audit;
use Academorix\Authorization\Attributes\RequirePermission;
use Academorix\Routing\Attributes\AsAction;
use Academorix\Routing\Attributes\Get;
use Academorix\Routing\Attributes\Middleware;
use Academorix\Routing\Concerns\AsController;
use Spatie\LaravelData\DataCollection;

/**
 * `GET /api/v1/audits` — tenant DPO reads own-tenant audit rows.
 *
 * Sensitive fields are masked at the {@see AuditData} projection —
 * the tenant DPO surface never sees restricted-tier plaintext
 * (that lives on the platform-admin surface).
 *
 * `BelongsToTenantOptional` scopes the read to the active tenant
 * plus the platform-plane rows (tenant_id NULL). The DPO surface
 * INTENTIONALLY excludes platform-plane rows because the DPO has no
 * standing to see cross-tenant compliance events —
 * {@see \Academorix\Audit\Policies\AuditPolicy::belongsToCaller()} enforces
 * this at the row level.
 *
 * @category Audit
 *
 * @since    0.1.0
 */
#[AsAction(name: 'audit.tenant.list')]
#[Get('/api/v1/audits')]
#[Middleware(['api', 'auth:sanctum', 'resolve.tenant', 'tenant.user'])]
#[RequirePermission(AuditPermission::View)]
final class ListAudits
{
    use AsController;

    public function __construct(
        private readonly AuditRepositoryInterface $audits,
    ) {
    }

    /**
     * @return DataCollection<int, AuditData>
     */
    public function __invoke(): DataCollection
    {
        $rows = $this->audits->paginate()
            ->getCollection()
            ->map(static fn (Audit $a): AuditData => AuditData::fromModel($a));

        return new DataCollection(AuditData::class, $rows);
    }
}
