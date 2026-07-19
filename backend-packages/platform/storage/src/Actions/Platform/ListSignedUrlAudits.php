<?php

declare(strict_types=1);

namespace Academorix\Storage\Actions\Platform;

use Academorix\Authorization\Attributes\RequirePermission;
use Academorix\Routing\Attributes\AsAction;
use Academorix\Routing\Attributes\Get;
use Academorix\Routing\Attributes\Middleware;
use Academorix\Routing\Concerns\AsController;
use Academorix\Storage\Contracts\Repositories\SignedUrlAuditRepositoryInterface;
use Academorix\Storage\Data\SignedUrlAuditData;
use Academorix\Storage\Enums\StoragePermission;
use Academorix\Storage\Models\SignedUrlAudit;
use Spatie\LaravelData\DataCollection;

/**
 * `GET /api/v1/platform/storage/signed-url-audits` — cross-tenant
 * signed-URL audit trail. High-cardinality — paginated.
 *
 * @category Storage
 *
 * @since    0.1.0
 */
#[AsAction(name: 'storage.platform.signed_url_audits')]
#[Get('/api/v1/platform/storage/signed-url-audits')]
#[Middleware(['api', 'auth:platform_admin'])]
#[RequirePermission(StoragePermission::View)]
final class ListSignedUrlAudits
{
    use AsController;

    public function __construct(
        private readonly SignedUrlAuditRepositoryInterface $audits,
    ) {
    }

    /**
     * @return DataCollection<int, SignedUrlAuditData>
     */
    public function __invoke(): DataCollection
    {
        $rows = $this->audits->query()
            ->withoutGlobalScopes()
            ->latest()
            ->limit(50)
            ->get()
            ->map(static fn (SignedUrlAudit $a): SignedUrlAuditData => SignedUrlAuditData::fromModel($a));

        return new DataCollection(SignedUrlAuditData::class, $rows);
    }
}
