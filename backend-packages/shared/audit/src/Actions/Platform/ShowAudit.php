<?php

declare(strict_types=1);

namespace Academorix\Audit\Actions\Platform;

use Academorix\Audit\Data\AuditData;
use Academorix\Audit\Enums\AuditPermission;
use Academorix\Audit\Models\Audit;
use Academorix\Authorization\Attributes\RequirePermission;
use Academorix\Routing\Attributes\AsAction;
use Academorix\Routing\Attributes\Get;
use Academorix\Routing\Attributes\Middleware;
use Academorix\Routing\Concerns\AsController;

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
