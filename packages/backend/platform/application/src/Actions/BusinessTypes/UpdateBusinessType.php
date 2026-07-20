<?php

declare(strict_types=1);

namespace Academorix\Application\Actions\BusinessTypes;

use Academorix\Application\Contracts\Repositories\BusinessTypeRepositoryInterface;
use Academorix\Application\Data\BusinessTypeData;
use Academorix\Application\Data\Requests\UpdateBusinessTypeRequestData;
use Academorix\Application\Enums\ApplicationPermission;
use Academorix\Authorization\Attributes\RequirePermission;
use Academorix\Routing\Attributes\AsAction;
use Academorix\Routing\Attributes\Middleware;
use Academorix\Routing\Attributes\Patch;
use Academorix\Routing\Concerns\AsController;

/**
 * `PATCH /api/v1/platform/business-types/{businessType}` — partial update.
 * Refused on system rows by policy + observer.
 *
 * @category Application
 *
 * @since    0.1.0
 */
#[AsAction(name: 'business-types.admin.update')]
#[Patch('/api/v1/platform/business-types/{businessType}')]
#[Middleware(['api', 'auth:platform_admin'])]
#[RequirePermission(ApplicationPermission::BusinessTypeUpdate)]
final class UpdateBusinessType
{
    use AsController;

    public function __construct(
        private readonly BusinessTypeRepositoryInterface $businessTypes,
    ) {}

    public function __invoke(string $businessType, UpdateBusinessTypeRequestData $data): BusinessTypeData
    {
        return BusinessTypeData::fromModel(
            $this->businessTypes->update($businessType, $data->toArray()),
        );
    }
}
