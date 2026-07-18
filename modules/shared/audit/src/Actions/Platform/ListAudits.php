<?php

declare(strict_types=1);

namespace Academorix\Audit\Actions\Platform;

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
 * `GET /api/v1/platform/audits` — every audit row across every
 * tenant. Platform admins only.
 *
 * Full field access — restricted-tier fields are NOT redacted here
 * because {@see AuditPermission::ViewAll} unmasks them at the
 * {@see AuditData} projection.
 *
 * @category Audit
 *
 * @since    0.1.0
 */
#[AsAction(name: 'audit.platform.list')]
#[Get('/api/v1/platform/audits')]
#[Middleware(['api', 'auth:platform_admin'])]
#[RequirePermission(AuditPermission::ViewAll)]
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
