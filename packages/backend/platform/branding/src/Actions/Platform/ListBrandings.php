<?php

declare(strict_types=1);

namespace Stackra\Branding\Actions\Platform;

use Stackra\Authorization\Attributes\RequirePermission;
use Stackra\Branding\Contracts\Repositories\BrandingRepositoryInterface;
use Stackra\Branding\Data\BrandingData;
use Stackra\Branding\Enums\BrandingPermission;
use Stackra\Branding\Models\Branding;
use Stackra\Routing\Attributes\AsAction;
use Stackra\Routing\Attributes\Get;
use Stackra\Routing\Attributes\Middleware;
use Stackra\Routing\Concerns\AsController;
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
