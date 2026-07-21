<?php

declare(strict_types=1);

namespace Stackra\Application\Actions\BusinessTypes;

use Stackra\Application\Contracts\Repositories\BusinessTypeRepositoryInterface;
use Stackra\Application\Data\BusinessTypeData;
use Stackra\Application\Enums\ApplicationPermission;
use Stackra\Application\Models\BusinessType;
use Stackra\Authorization\Attributes\RequirePermission;
use Stackra\Routing\Attributes\AsAction;
use Stackra\Routing\Attributes\Get;
use Stackra\Routing\Attributes\Middleware;
use Stackra\Routing\Concerns\AsController;
use Spatie\LaravelData\DataCollection;

/**
 * `GET /api/v1/platform/business-types` — platform-admin list.
 * Combines platform defaults + every tenant's customs into one paged view.
 *
 * @category Application
 *
 * @since    0.1.0
 */
#[AsAction(name: 'business-types.admin.list')]
#[Get('/api/v1/platform/business-types')]
#[Middleware(['api', 'auth:platform_admin'])]
#[RequirePermission(ApplicationPermission::BusinessTypeViewAny)]
final class ListBusinessTypes
{
    use AsController;

    public function __construct(
        private readonly BusinessTypeRepositoryInterface $businessTypes,
    ) {}

    /**
     * @return DataCollection<int, BusinessTypeData>
     */
    public function __invoke(): DataCollection
    {
        $rows = $this->businessTypes->paginate()
            ->getCollection()
            ->map(static fn (BusinessType $t): BusinessTypeData => BusinessTypeData::fromModel($t));

        return new DataCollection(BusinessTypeData::class, $rows);
    }
}
