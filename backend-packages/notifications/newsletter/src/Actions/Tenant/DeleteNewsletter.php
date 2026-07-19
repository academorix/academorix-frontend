<?php

declare(strict_types=1);

namespace Academorix\Newsletter\Actions\Tenant;

use Academorix\Authorization\Attributes\RequirePermission;
use Academorix\Newsletter\Contracts\Repositories\NewsletterRepositoryInterface;
use Academorix\Newsletter\Enums\NewsletterPermission;
use Academorix\Newsletter\Exceptions\NewsletterNotFoundException;
use Academorix\Routing\Attributes\AsAction;
use Academorix\Routing\Attributes\Delete;
use Academorix\Routing\Attributes\Middleware;
use Academorix\Routing\Concerns\AsController;
use Illuminate\Http\JsonResponse;

/**
 * `DELETE /api/v1/newsletters/{newsletter}` — soft-delete a
 * newsletter and cascade to its issues / subscriptions / campaigns /
 * audiences.
 *
 * @category Newsletter
 *
 * @since    0.1.0
 */
#[AsAction(name: 'newsletters.delete')]
#[Delete('/api/v1/newsletters/{newsletter}')]
#[Middleware(['api', 'resolve.tenant', 'auth:sanctum', 'tenant.user'])]
#[RequirePermission(NewsletterPermission::NewslettersDelete)]
final class DeleteNewsletter
{
    use AsController;

    public function __construct(
        private readonly NewsletterRepositoryInterface $newsletters,
    ) {
    }

    public function __invoke(string $newsletter): JsonResponse
    {
        $model = $this->newsletters->find($newsletter);
        if ($model === null) {
            throw new NewsletterNotFoundException('Newsletter not found.');
        }

        $model->delete();

        return response()->json(null, JsonResponse::HTTP_NO_CONTENT);
    }
}
