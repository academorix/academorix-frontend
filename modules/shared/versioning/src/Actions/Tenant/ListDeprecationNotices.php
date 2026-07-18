<?php

declare(strict_types=1);

namespace Academorix\Versioning\Actions\Tenant;

use Academorix\Routing\Attributes\AsAction;
use Academorix\Routing\Attributes\Get;
use Academorix\Routing\Attributes\Middleware;
use Academorix\Routing\Concerns\AsController;
use Academorix\Versioning\Contracts\Repositories\DeprecationNoticeRepositoryInterface;
use Academorix\Versioning\Data\DeprecationNoticeData;
use Academorix\Versioning\Enums\DeprecationSurface;
use Academorix\Versioning\Models\DeprecationNotice;
use Spatie\LaravelData\DataCollection;

/**
 * `GET /api/v1/tenant/versioning/deprecation-notices` — the notices
 * actively affecting REST + webhook + graphql surfaces at the moment
 * of the request. Downstream consumers narrow further (e.g. per pinned
 * subscription version) but the tenant view is unfiltered by default.
 *
 * @category Versioning
 *
 * @since    0.1.0
 */
#[AsAction(name: 'versioning.tenant.deprecation_notices.list')]
#[Get('/api/v1/tenant/versioning/deprecation-notices')]
#[Middleware(['api', 'resolve.tenant', 'auth:sanctum', 'tenant.user'])]
final class ListDeprecationNotices
{
    use AsController;

    public function __construct(
        private readonly DeprecationNoticeRepositoryInterface $notices,
    ) {
    }

    /**
     * @return DataCollection<int, DeprecationNoticeData>
     */
    public function __invoke(): DataCollection
    {
        $rows = $this->notices
            ->findActiveForSurface(DeprecationSurface::All)
            ->filter(static fn (DeprecationNotice $n): bool => $n->isCurrentlyActive())
            ->values()
            ->map(static fn (DeprecationNotice $n): DeprecationNoticeData => DeprecationNoticeData::fromModel($n));

        return new DataCollection(DeprecationNoticeData::class, $rows);
    }
}
