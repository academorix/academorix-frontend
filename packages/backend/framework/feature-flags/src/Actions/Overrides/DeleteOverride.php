<?php

declare(strict_types=1);

namespace Academorix\FeatureFlags\Actions\Overrides;

use Academorix\Authorization\Attributes\RequirePermission;
use Academorix\FeatureFlags\Contracts\Repositories\FeatureOverrideRepositoryInterface;
use Academorix\Routing\Attributes\AsAction;
use Academorix\Routing\Attributes\Delete;
use Academorix\Routing\Attributes\Middleware;
use Academorix\Routing\Attributes\WhereUlid;
use Illuminate\Http\Response;

/**
 * `DELETE /api/v1/feature-flags/overrides/{id}` — soft-delete an override.
 *
 * @category FeatureFlags
 *
 * @since    0.1.0
 */
#[AsAction(name: 'feature-flags.overrides.delete')]
#[Delete('/api/v1/feature-flags/overrides/{id}')]
#[Middleware(['api', 'auth:sanctum'])]
#[RequirePermission('feature-flags.overrides.manage')]
#[WhereUlid('id')]
final class DeleteOverride
{
    /**
     * @param  FeatureOverrideRepositoryInterface  $repository  Override persistence boundary.
     */
    public function __construct(
        private readonly FeatureOverrideRepositoryInterface $repository,
    ) {}

    /**
     * Handle the request.
     *
     * @param  string  $id  Override id from the URL.
     * @return Response
     */
    public function __invoke(string $id): Response
    {
        $this->repository->delete($id);

        return \response()->noContent();
    }
}
