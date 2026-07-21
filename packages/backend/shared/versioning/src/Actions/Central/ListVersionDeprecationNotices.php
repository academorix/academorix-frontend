<?php

declare(strict_types=1);

namespace Stackra\Versioning\Actions\Central;

use Stackra\Routing\Attributes\AsAction;
use Stackra\Routing\Attributes\Get;
use Stackra\Routing\Attributes\Middleware;
use Stackra\Routing\Concerns\AsController;
use Stackra\Versioning\Contracts\Data\ApiVersionInterface;
use Stackra\Versioning\Contracts\Repositories\ApiVersionRepositoryInterface;
use Stackra\Versioning\Contracts\Repositories\DeprecationNoticeRepositoryInterface;
use Stackra\Versioning\Data\DeprecationNoticeData;
use Stackra\Versioning\Exceptions\ApiVersionNotFoundException;
use Stackra\Versioning\Models\DeprecationNotice;
use Spatie\LaravelData\DataCollection;

/**
 * `GET /api/versions/{slug}/deprecation-notices` — public list of
 * published deprecation notices affecting a version. Unauthenticated.
 *
 * @category Versioning
 *
 * @since    0.1.0
 */
#[AsAction(name: 'versioning.central.versions.deprecation_notices.list')]
#[Get('/api/versions/{slug}/deprecation-notices')]
#[Middleware(['api'])]
final class ListVersionDeprecationNotices
{
    use AsController;

    public function __construct(
        private readonly ApiVersionRepositoryInterface $versions,
        private readonly DeprecationNoticeRepositoryInterface $notices,
    ) {
    }

    /**
     * @return DataCollection<int, DeprecationNoticeData>
     */
    public function __invoke(string $slug): DataCollection
    {
        $version = $this->versions->findBySlug($slug);
        if ($version === null) {
            throw new ApiVersionNotFoundException(\sprintf(
                'API version "%s" not found.',
                $slug,
            ));
        }

        $rows = $this->notices
            ->findByVersion((string) $version->{ApiVersionInterface::ATTR_ID})
            ->filter(static fn (DeprecationNotice $n): bool => $n->isCurrentlyActive())
            ->values()
            ->map(static fn (DeprecationNotice $n): DeprecationNoticeData => DeprecationNoticeData::fromModel($n));

        return new DataCollection(DeprecationNoticeData::class, $rows);
    }
}
