<?php

declare(strict_types=1);

namespace Academorix\Application\Actions\Applications;

use Academorix\Application\Contracts\Repositories\ApplicationRepositoryInterface;
use Academorix\Application\Enums\ApplicationPermission;
use Academorix\Authorization\Attributes\RequirePermission;
use Academorix\Routing\Attributes\AsAction;
use Academorix\Routing\Attributes\Delete;
use Academorix\Routing\Attributes\Middleware;
use Academorix\Routing\Concerns\AsController;
use Illuminate\Http\Response;

/**
 * `DELETE /api/v1/platform/applications/{application}` — soft-delete.
 * Refused on `is_system: true` rows by policy + observer.
 *
 * @category Application
 *
 * @since    0.1.0
 */
#[AsAction(name: 'applications.admin.delete')]
#[Delete('/api/v1/platform/applications/{application}')]
#[Middleware(['api', 'auth:platform_admin'])]
#[RequirePermission(ApplicationPermission::Delete)]
final class DeleteApplication
{
    use AsController;

    public function __construct(
        private readonly ApplicationRepositoryInterface $applications,
    ) {}

    public function __invoke(string $application): Response
    {
        $this->applications->delete($application);

        return response()->noContent();
    }
}
