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
