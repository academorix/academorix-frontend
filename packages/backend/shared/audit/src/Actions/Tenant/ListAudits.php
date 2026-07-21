<?php

declare(strict_types=1);

namespace Stackra\Audit\Actions\Tenant;

use Stackra\Audit\Contracts\Repositories\AuditRepositoryInterface;
use Stackra\Audit\Data\AuditData;
use Stackra\Audit\Enums\AuditPermission;
use Stackra\Audit\Models\Audit;
use Stackra\Authorization\Attributes\RequirePermission;
use Stackra\Routing\Attributes\AsAction;
use Stackra\Routing\Attributes\Get;
use Stackra\Routing\Attributes\Middleware;
use Stackra\Routing\Concerns\AsController;
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
 * {@see \Stackra\Audit\Policies\AuditPolicy::belongsToCaller()} enforces
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
