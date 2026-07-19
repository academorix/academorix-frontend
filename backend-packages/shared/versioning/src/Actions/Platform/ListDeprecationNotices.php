<?php

declare(strict_types=1);

namespace Academorix\Versioning\Actions\Platform;

use Academorix\Authorization\Attributes\RequirePermission;
use Academorix\Routing\Attributes\AsAction;
use Academorix\Routing\Attributes\Get;
use Academorix\Routing\Attributes\Middleware;
use Academorix\Routing\Concerns\AsController;
use Academorix\Versioning\Contracts\Repositories\DeprecationNoticeRepositoryInterface;
use Academorix\Versioning\Data\DeprecationNoticeData;
use Academorix\Versioning\Enums\VersioningPermission;
use Academorix\Versioning\Models\DeprecationNotice;
use Spatie\LaravelData\DataCollection;

/**
 * `GET /api/v1/platform/versioning/deprecation-notices` — every
 * deprecation notice across every ApiVersion.
 *
 * @category Versioning
 *
 * @since    0.1.0
 */
#[AsAction(name: 'versioning.platform.deprecation_notices.list')]
#[Get('/api/v1/platform/versioning/deprecation-notices')]
#[Middleware(['api', 'auth:platform_admin'])]
#[RequirePermission(VersioningPermission::View)]
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
        $rows = $this->notices->paginate()
            ->getCollection()
            ->map(static fn (DeprecationNotice $n): DeprecationNoticeData => DeprecationNoticeData::fromModel($n));

        return new DataCollection(DeprecationNoticeData::class, $rows);
    }
}
