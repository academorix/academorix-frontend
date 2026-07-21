<?php

declare(strict_types=1);

namespace Stackra\Audit\Actions\Platform;

use Stackra\Audit\Data\AuditData;
use Stackra\Audit\Enums\AuditPermission;
use Stackra\Audit\Models\Audit;
use Stackra\Authorization\Attributes\RequirePermission;
use Stackra\Routing\Attributes\AsAction;
use Stackra\Routing\Attributes\Get;
use Stackra\Routing\Attributes\Middleware;
use Stackra\Routing\Concerns\AsController;

/**
 * `GET /api/v1/platform/audits/{audit}` — one audit row by id.
 *
 * Route-model-binding resolves the `{audit}` parameter through
 * Eloquent's default key (our overridden string ULID column).
 *
 * @category Audit
 *
 * @since    0.1.0
 */
#[AsAction(name: 'audit.platform.show')]
#[Get('/api/v1/platform/audits/{audit}')]
#[Middleware(['api', 'auth:platform_admin'])]
#[RequirePermission(AuditPermission::ViewAll)]
final class ShowAudit
{
    use AsController;

    public function __invoke(Audit $audit): AuditData
    {
        return AuditData::fromModel($audit);
    }
}
