<?php

declare(strict_types=1);

namespace Academorix\Application\Actions\BusinessTypes;

use Academorix\Application\Contracts\Repositories\BusinessTypeRepositoryInterface;
use Academorix\Application\Enums\ApplicationPermission;
use Academorix\Authorization\Attributes\RequirePermission;
use Academorix\Routing\Attributes\AsAction;
use Academorix\Routing\Attributes\Delete;
use Academorix\Routing\Attributes\Middleware;
use Academorix\Routing\Concerns\AsController;
use Illuminate\Http\Response;

/**
 * `DELETE /api/v1/platform/business-types/{businessType}` — soft-delete.
 * Refused on system rows.
 *
 * @category Application
 *
 * @since    0.1.0
 */
#[AsAction(name: 'business-types.admin.delete')]
#[Delete('/api/v1/platform/business-types/{businessType}')]
#[Middleware(['api', 'auth:platform_admin'])]
#[RequirePermission(ApplicationPermission::BusinessTypeDelete)]
final class DeleteBusinessType
{
    use AsController;

    public function __construct(
        private readonly BusinessTypeRepositoryInterface $businessTypes,
    ) {}

    public function __invoke(string $businessType): Response
    {
        $this->businessTypes->delete($businessType);

        return response()->noContent();
    }
}
