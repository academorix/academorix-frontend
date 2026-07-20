<?php

declare(strict_types=1);

namespace Academorix\Audit\Actions\Tenant;

use Academorix\Audit\Data\AuditData;
use Academorix\Audit\Enums\AuditPermission;
use Academorix\Audit\Models\Audit;
use Academorix\Authorization\Attributes\RequirePermission;
use Academorix\Routing\Attributes\AsAction;
use Academorix\Routing\Attributes\Get;
use Academorix\Routing\Attributes\Middleware;
use Academorix\Routing\Concerns\AsController;

/**
 * `GET /api/v1/audits/{audit}` — tenant DPO reads a single
 * own-tenant audit row.
 *
 * Sensitive fields are masked. The
 * {@see \Academorix\Audit\Policies\AuditPolicy::view()} check further
 * enforces the tenant scoping — even if a caller supplies an id
 * outside their tenant, the policy denies before serialisation.
 *
 * @category Audit
 *
 * @since    0.1.0
 */
#[AsAction(name: 'audit.tenant.show')]
#[Get('/api/v1/audits/{audit}')]
#[Middleware(['api', 'auth:sanctum', 'resolve.tenant', 'tenant.user'])]
#[RequirePermission(AuditPermission::View)]
final class ShowAudit
{
    use AsController;

    public function __invoke(Audit $audit): AuditData
    {
        return AuditData::fromModel($audit);
    }
}
