<?php

declare(strict_types=1);

namespace Stackra\Application\Actions\BusinessTypes;

use Stackra\Application\Contracts\Repositories\BusinessTypeRepositoryInterface;
use Stackra\Application\Data\BusinessTypeData;
use Stackra\Application\Enums\ApplicationPermission;
use Stackra\Authorization\Attributes\RequirePermission;
use Stackra\Routing\Attributes\AsAction;
use Stackra\Routing\Attributes\Get;
use Stackra\Routing\Attributes\Middleware;
use Stackra\Routing\Concerns\AsController;

/**
 * `GET /api/v1/platform/business-types/{businessType}` — platform-admin read.
 *
 * @category Application
 *
 * @since    0.1.0
 */
#[AsAction(name: 'business-types.admin.show')]
#[Get('/api/v1/platform/business-types/{businessType}')]
#[Middleware(['api', 'auth:platform_admin'])]
#[RequirePermission(ApplicationPermission::BusinessTypeView)]
final class ShowBusinessType
{
    use AsController;

    public function __construct(
        private readonly BusinessTypeRepositoryInterface $businessTypes,
    ) {}

    public function __invoke(string $businessType): BusinessTypeData
    {
        return BusinessTypeData::fromModel(
            $this->businessTypes->findOrFail($businessType),
        );
    }
}
