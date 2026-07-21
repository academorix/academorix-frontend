<?php

declare(strict_types=1);

namespace Stackra\Storage\Actions\Platform;

use Stackra\Authorization\Attributes\RequirePermission;
use Stackra\Routing\Attributes\AsAction;
use Stackra\Routing\Attributes\Get;
use Stackra\Routing\Attributes\Middleware;
use Stackra\Routing\Concerns\AsController;
use Stackra\Storage\Contracts\Repositories\SignedUrlAuditRepositoryInterface;
use Stackra\Storage\Data\SignedUrlAuditData;
use Stackra\Storage\Enums\StoragePermission;
use Stackra\Storage\Models\SignedUrlAudit;
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
