<?php

declare(strict_types=1);

namespace Stackra\Versioning\Actions\Platform;

use Stackra\Authorization\Attributes\RequirePermission;
use Stackra\Routing\Attributes\AsAction;
use Stackra\Routing\Attributes\Get;
use Stackra\Routing\Attributes\Middleware;
use Stackra\Routing\Concerns\AsController;
use Stackra\Versioning\Contracts\Repositories\DeprecationNoticeRepositoryInterface;
use Stackra\Versioning\Data\DeprecationNoticeData;
use Stackra\Versioning\Enums\VersioningPermission;
use Stackra\Versioning\Models\DeprecationNotice;
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
