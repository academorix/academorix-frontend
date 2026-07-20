<?php

declare(strict_types=1);

namespace Academorix\Application\Actions\Applications;

use Academorix\Application\Contracts\Repositories\ApplicationRepositoryInterface;
use Academorix\Application\Data\ApplicationData;
use Academorix\Application\Models\Application;
use Academorix\Routing\Attributes\AsAction;
use Academorix\Routing\Attributes\Get;
use Academorix\Routing\Attributes\Middleware;
use Academorix\Routing\Concerns\AsController;
use Spatie\LaravelData\DataCollection;

/**
 * `GET /api/v1/applications` — public product-catalogue discovery
 * (central host). No auth required — the marketing surface renders
 * the enabled Applications on the tenant-picker screen.
 *
 * @category Application
 *
 * @since    0.1.0
 */
#[AsAction(name: 'applications.list')]
#[Get('/api/v1/applications')]
#[Middleware(['api'])]
final class ListApplications
{
    use AsController;

    public function __construct(
        private readonly ApplicationRepositoryInterface $applications,
    ) {}

    /**
     * List every enabled Application. Deleted rows are filtered by
     * the SoftDeletes global scope.
     *
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
