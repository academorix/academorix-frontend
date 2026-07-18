<?php

declare(strict_types=1);

namespace Academorix\Branding\Actions\Platform;

use Academorix\Authorization\Attributes\RequirePermission;
use Academorix\Branding\Contracts\Repositories\BrandingRepositoryInterface;
use Academorix\Branding\Data\BrandingData;
use Academorix\Branding\Enums\BrandingPermission;
use Academorix\Branding\Models\Branding;
use Academorix\Routing\Attributes\AsAction;
use Academorix\Routing\Attributes\Get;
use Academorix\Routing\Attributes\Middleware;
use Academorix\Routing\Concerns\AsController;
use Spatie\LaravelData\DataCollection;

/**
 * `GET /api/v1/platform/brandings` — every branding profile across
 * every tenant.
 *
 * @category Branding
 *
 * @since    0.1.0
 */
#[AsAction(name: 'branding.platform.list')]
#[Get('/api/v1/platform/brandings')]
#[Middleware(['api', 'auth:platform_admin'])]
#[RequirePermission(BrandingPermission::View)]
final class ListBrandings
{
    use AsController;

    public function __construct(
        private readonly BrandingRepositoryInterface $brandings,
    ) {
    }

    /**
     * @return DataCollection<int, BrandingData>
     */
    public function __invoke(): DataCollection
    {
        $rows = $this->brandings->paginate()
            ->getCollection()
            ->map(static fn (Branding $b): BrandingData => BrandingData::fromModel($b));

        return new DataCollection(BrandingData::class, $rows);
    }
}
