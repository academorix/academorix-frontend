<?php

declare(strict_types=1);

namespace Stackra\Application\Actions\BusinessTypes;

use Stackra\Application\Contracts\Data\BusinessTypeInterface;
use Stackra\Application\Contracts\Repositories\BusinessTypeRepositoryInterface;
use Stackra\Application\Data\BusinessTypeData;
use Stackra\Application\Data\Requests\CreateBusinessTypeRequestData;
use Stackra\Application\Enums\ApplicationPermission;
use Stackra\Authorization\Attributes\RequirePermission;
use Stackra\Routing\Attributes\AsAction;
use Stackra\Routing\Attributes\Middleware;
use Stackra\Routing\Attributes\Post;
use Stackra\Routing\Concerns\AsController;

/**
 * `POST /api/v1/platform/business-types` — create a tenant-CUSTOM row.
 *
 * Platform admins never create `is_system: true` rows via HTTP — only
 * via the seeder. The action forces `is_system = false` regardless
 * of what the payload asked for.
 *
 * @category Application
 *
 * @since    0.1.0
 */
#[AsAction(name: 'business-types.admin.create')]
#[Post('/api/v1/platform/business-types')]
#[Middleware(['api', 'auth:platform_admin'])]
#[RequirePermission(ApplicationPermission::BusinessTypeCreate)]
final class CreateBusinessType
{
    use AsController;

    public function __construct(
        private readonly BusinessTypeRepositoryInterface $businessTypes,
    ) {}

    public function __invoke(CreateBusinessTypeRequestData $data): BusinessTypeData
    {
        $attributes = $data->toArray();
        // Force is_system = false — HTTP writes never create system rows.
        // The seeder is the only sanctioned path (paired with
        // BusinessType::allowSystemMutation() scope).
        $attributes[BusinessTypeInterface::ATTR_IS_SYSTEM] = false;

        return BusinessTypeData::fromModel(
            $this->businessTypes->create($attributes),
        );
    }
}
