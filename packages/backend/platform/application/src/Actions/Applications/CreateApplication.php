<?php

declare(strict_types=1);

namespace Stackra\Application\Actions\Applications;

use Stackra\Application\Contracts\Repositories\ApplicationRepositoryInterface;
use Stackra\Application\Data\ApplicationData;
use Stackra\Application\Data\Requests\CreateApplicationRequestData;
use Stackra\Application\Enums\ApplicationPermission;
use Stackra\Authorization\Attributes\RequirePermission;
use Stackra\Routing\Attributes\AsAction;
use Stackra\Routing\Attributes\Middleware;
use Stackra\Routing\Attributes\Post;
use Stackra\Routing\Concerns\AsController;

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
