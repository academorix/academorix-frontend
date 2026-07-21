<?php

declare(strict_types=1);

namespace Stackra\Application\Actions\Applications;

use Stackra\Application\Contracts\Repositories\ApplicationRepositoryInterface;
use Stackra\Application\Enums\ApplicationPermission;
use Stackra\Authorization\Attributes\RequirePermission;
use Stackra\Routing\Attributes\AsAction;
use Stackra\Routing\Attributes\Delete;
use Stackra\Routing\Attributes\Middleware;
use Stackra\Routing\Concerns\AsController;
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
