<?php

declare(strict_types=1);

namespace Stackra\Application\Actions\Applications;

use Stackra\Application\Contracts\Repositories\ApplicationRepositoryInterface;
use Stackra\Application\Data\ApplicationData;
use Stackra\Routing\Attributes\AsAction;
use Stackra\Routing\Attributes\Get;
use Stackra\Routing\Attributes\Middleware;
use Stackra\Routing\Attributes\Where;
use Stackra\Routing\Concerns\AsController;
use Illuminate\Database\Eloquent\ModelNotFoundException;

/**
 * `GET /api/v1/applications/{slug}` — public read (central host).
 *
 * @category Application
 *
 * @since    0.1.0
 */
#[AsAction(name: 'applications.show')]
#[Get('/api/v1/applications/{slug}')]
#[Where('slug', '[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?')]
#[Middleware(['api'])]
final class ShowApplication
{
    use AsController;

    public function __construct(
        private readonly ApplicationRepositoryInterface $applications,
    ) {}

    /**
     * @param  string  $slug  Route-bound Application slug.
     * @return ApplicationData
     *
     * @throws ModelNotFoundException  When no Application matches the slug.
     */
    public function __invoke(string $slug): ApplicationData
    {
        $application = $this->applications->findBySlug($slug);
        if ($application === null) {
            throw (new ModelNotFoundException())->setModel(
                \Stackra\Application\Models\Application::class,
                [$slug],
            );
        }

        return ApplicationData::fromModel($application);
    }
}
