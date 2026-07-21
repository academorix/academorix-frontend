<?php

declare(strict_types=1);

namespace Stackra\Audit\Actions\Tenant;

use Stackra\Audit\Data\AuditData;
use Stackra\Audit\Enums\AuditPermission;
use Stackra\Audit\Models\Audit;
use Stackra\Authorization\Attributes\RequirePermission;
use Stackra\Routing\Attributes\AsAction;
use Stackra\Routing\Attributes\Get;
use Stackra\Routing\Attributes\Middleware;
use Stackra\Routing\Concerns\AsController;

/**
 * `GET /api/v1/audits/{audit}` — tenant DPO reads a single
 * own-tenant audit row.
 *
 * Sensitive fields are masked. The
 * {@see \Stackra\Audit\Policies\AuditPolicy::view()} check further
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
