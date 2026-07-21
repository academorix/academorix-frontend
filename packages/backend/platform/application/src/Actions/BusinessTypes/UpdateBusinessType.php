<?php

declare(strict_types=1);

namespace Stackra\Application\Actions\BusinessTypes;

use Stackra\Application\Contracts\Repositories\BusinessTypeRepositoryInterface;
use Stackra\Application\Data\BusinessTypeData;
use Stackra\Application\Data\Requests\UpdateBusinessTypeRequestData;
use Stackra\Application\Enums\ApplicationPermission;
use Stackra\Authorization\Attributes\RequirePermission;
use Stackra\Routing\Attributes\AsAction;
use Stackra\Routing\Attributes\Middleware;
use Stackra\Routing\Attributes\Patch;
use Stackra\Routing\Concerns\AsController;

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
