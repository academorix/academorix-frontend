<?php

declare(strict_types=1);

namespace Stackra\Application\Actions\BusinessTypes;

use Stackra\Application\Contracts\Repositories\BusinessTypeRepositoryInterface;
use Stackra\Application\Enums\ApplicationPermission;
use Stackra\Authorization\Attributes\RequirePermission;
use Stackra\Routing\Attributes\AsAction;
use Stackra\Routing\Attributes\Delete;
use Stackra\Routing\Attributes\Middleware;
use Stackra\Routing\Concerns\AsController;
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
