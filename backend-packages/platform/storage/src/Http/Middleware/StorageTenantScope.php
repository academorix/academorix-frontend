<?php

declare(strict_types=1);

namespace Academorix\Storage\Http\Middleware;

use Academorix\Routing\Attributes\AsMiddleware;
use Academorix\Storage\Contracts\Data\FileInterface;
use Academorix\Storage\Models\File;
use Academorix\Tenancy\Contracts\Services\TenantContextInterface;
use Closure;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;

/**
 * Hardens the tenant scope on file routes — verifies the requested
 * File's `tenant_id` matches the resolved tenant.
 *
 * The `BelongsToTenant` trait already applies a global scope on
 * queries, but this middleware fails FAST for a mismatched id
 * before an action body runs.
 *
 * @category Storage
 *
 * @since    0.1.0
 */
#[AsMiddleware(alias: 'storage.tenant.scope', groups: [], priority: 45)]
final class StorageTenantScope
{
    public function __construct(
        private readonly TenantContextInterface $tenantContext,
    ) {
    }

    public function handle(Request $request, Closure $next): Response|JsonResponse
    {
        $tenant = $this->tenantContext->current();
        if ($tenant === null) {
            return $next($request);
        }

        $fileId = (string) $request->route('file', '');
        if ($fileId === '') {
            return $next($request);
        }

        // Reads WITH the global scope — mismatch resolves to null
        // and returns 404 rather than 403 to avoid leaking existence.
        /** @var File|null $file */
        $file = File::query()->find($fileId);

        if ($file === null) {
            return new JsonResponse([
                'message' => __('storage::errors.not_found'),
                'code'    => 'storage.not_found',
            ], 404);
        }

        if ($file->{FileInterface::ATTR_TENANT_ID} !== $tenant->getKey()) {
            return new JsonResponse([
                'message' => __('storage::errors.not_found'),
                'code'    => 'storage.not_found',
            ], 404);
        }

        return $next($request);
    }
}
