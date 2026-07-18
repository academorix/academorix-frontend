<?php

declare(strict_types=1);

namespace Academorix\Application\Actions\Applications;

use Academorix\Application\Contracts\Repositories\ApplicationRepositoryInterface;
use Academorix\Application\Data\ApplicationData;
use Academorix\Application\Enums\ApplicationPermission;
use Academorix\Application\Models\Application;
use Academorix\Authorization\Attributes\RequirePermission;
use Academorix\Routing\Attributes\AsAction;
use Academorix\Routing\Attributes\Get;
use Academorix\Routing\Attributes\Middleware;
use Academorix\Routing\Concerns\AsController;

/**
 * `GET /api/v1/platform/applications/{application}` — platform-admin
 * read by id. Route-model binds on primary key.
 *
 * @category Application
 *
 * @since    0.1.0
 */
#[AsAction(name: 'applications.admin.show')]
#[Get('/api/v1/platform/applications/{application}')]
#[Middleware(['api', 'auth:platform_admin'])]
#[RequirePermission(ApplicationPermission::View)]
final class ShowApplicationAdmin
{
    use AsController;

    public function __construct(
        private readonly ApplicationRepositoryInterface $applications,
    ) {}

    public function __invoke(string $application): ApplicationData
    {
        return ApplicationData::fromModel(
            $this->applications->findOrFail($application),
        );
    }
}
