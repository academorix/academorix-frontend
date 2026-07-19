<?php

declare(strict_types=1);

namespace Academorix\Application\Actions\Applications;

use Academorix\Application\Contracts\Repositories\ApplicationRepositoryInterface;
use Academorix\Application\Data\ApplicationData;
use Academorix\Application\Data\Requests\CreateApplicationRequestData;
use Academorix\Application\Enums\ApplicationPermission;
use Academorix\Authorization\Attributes\RequirePermission;
use Academorix\Routing\Attributes\AsAction;
use Academorix\Routing\Attributes\Middleware;
use Academorix\Routing\Attributes\Post;
use Academorix\Routing\Concerns\AsController;

/**
 * `POST /api/v1/platform/applications` — create a new Application row.
 * Platform-admin only.
 *
 * @category Application
 *
 * @since    0.1.0
 */
#[AsAction(name: 'applications.admin.create')]
#[Post('/api/v1/platform/applications')]
#[Middleware(['api', 'auth:platform_admin'])]
#[RequirePermission(ApplicationPermission::Create)]
final class CreateApplication
{
    use AsController;

    public function __construct(
        private readonly ApplicationRepositoryInterface $applications,
    ) {}

    public function __invoke(CreateApplicationRequestData $data): ApplicationData
    {
        // The `Unique` validators on the DTO caught slug/host collisions
        // before we get here — this call is a straight write.
        return ApplicationData::fromModel(
            $this->applications->create($data->toArray()),
        );
    }
}
