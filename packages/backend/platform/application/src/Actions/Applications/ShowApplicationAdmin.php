<?php

declare(strict_types=1);

namespace Stackra\Application\Actions\Applications;

use Stackra\Application\Contracts\Repositories\ApplicationRepositoryInterface;
use Stackra\Application\Data\ApplicationData;
use Stackra\Application\Enums\ApplicationPermission;
use Stackra\Application\Models\Application;
use Stackra\Authorization\Attributes\RequirePermission;
use Stackra\Routing\Attributes\AsAction;
use Stackra\Routing\Attributes\Get;
use Stackra\Routing\Attributes\Middleware;
use Stackra\Routing\Concerns\AsController;

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
