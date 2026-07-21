<?php

declare(strict_types=1);

namespace Stackra\Application\Actions\Applications;

use Stackra\Application\Contracts\Repositories\ApplicationRepositoryInterface;
use Stackra\Application\Data\ApplicationData;
use Stackra\Application\Data\Requests\UpdateApplicationRequestData;
use Stackra\Application\Enums\ApplicationPermission;
use Stackra\Authorization\Attributes\RequirePermission;
use Stackra\Routing\Attributes\AsAction;
use Stackra\Routing\Attributes\Middleware;
use Stackra\Routing\Attributes\Patch;
use Stackra\Routing\Concerns\AsController;

/**
 * `PATCH /api/v1/platform/applications/{application}` — partial update.
 * Refused on `is_system: true` rows by the policy + observer.
 *
 * @category Application
 *
 * @since    0.1.0
 */
#[AsAction(name: 'applications.admin.update')]
#[Patch('/api/v1/platform/applications/{application}')]
#[Middleware(['api', 'auth:platform_admin'])]
#[RequirePermission(ApplicationPermission::Update)]
final class UpdateApplication
{
    use AsController;

    public function __construct(
        private readonly ApplicationRepositoryInterface $applications,
    ) {}

    public function __invoke(string $application, UpdateApplicationRequestData $data): ApplicationData
    {
        $updated = $this->applications->update($application, $data->toArray());

        return ApplicationData::fromModel($updated);
    }
}
