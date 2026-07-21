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
use Spatie\LaravelData\DataCollection;

/**
 * `GET /api/v1/platform/applications` — platform-admin list.
 * Includes archived rows via `?with_trashed=1`.
 *
 * @category Application
 *
 * @since    0.1.0
 */
#[AsAction(name: 'applications.admin.list')]
#[Get('/api/v1/platform/applications')]
#[Middleware(['api', 'auth:platform_admin'])]
#[RequirePermission(ApplicationPermission::ViewAny)]
final class ListApplicationsAdmin
{
    use AsController;

    public function __construct(
        private readonly ApplicationRepositoryInterface $applications,
    ) {}

    /**
     * @return DataCollection<int, ApplicationData>
     */
    public function __invoke(): DataCollection
    {
        $rows = $this->applications->paginate()
            ->getCollection()
            ->map(static fn (Application $a): ApplicationData => ApplicationData::fromModel($a));

        return new DataCollection(ApplicationData::class, $rows);
    }
}
