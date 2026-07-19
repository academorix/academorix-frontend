<?php

declare(strict_types=1);

namespace Academorix\Storage\Http\Middleware;

use Academorix\Routing\Attributes\AsMiddleware;
use Academorix\Storage\Contracts\Data\FileInterface;
use Academorix\Storage\Events\StorageQuotaExceeded;
use Academorix\Storage\Models\File;
use Academorix\Tenancy\Contracts\Services\TenantContextInterface;
use Closure;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;

/**
 * Refuse uploads that would cross the tenant's byte quota.
 *
 * Reads the tenant's current consumed bytes + adds the incoming
 * payload size; compares against the plan cap (or the configured
 * default when the tenant has no plan-defined cap).
 *
 * @category Storage
 *
 * @since    0.1.0
 */
#[AsMiddleware(alias: 'storage.quota.enforce', groups: [], priority: 65)]
final class StorageQuotaEnforce
{
    public function __construct(
        private readonly TenantContextInterface $tenantContext,
    ) {
    }

    public function handle(Request $request, Closure $next): Response|JsonResponse
    {
        $tenant = $this->tenantContext->current();
        if ($tenant === null) {
            // No tenant context — nothing to enforce; let the
            // action layer decide.
            return $next($request);
        }

        $file = $request->file('file');
        if ($file === null || \is_array($file)) {
            return $next($request);
        }

        $incoming = (int) $file->getSize();
        $capBytes = (int) \config('storage.quotas.default_bytes', 5_368_709_120);

        if ($capBytes <= 0) {
            return $next($request);
        }

        $tenantId = (string) $tenant->getKey();
        $consumed = (int) File::query()
            ->where(FileInterface::ATTR_TENANT_ID, $tenantId)
            ->sum(FileInterface::ATTR_SIZE_BYTES);

        if ($consumed + $incoming > $capBytes) {
            StorageQuotaExceeded::dispatch($tenantId, $consumed, $capBytes, $incoming);

            return new JsonResponse([
                'message' => __('storage::errors.quota_exceeded'),
                'code'    => 'storage.quota_exceeded',
                'context' => ['consumed_bytes' => $consumed, 'cap_bytes' => $capBytes, 'incoming_bytes' => $incoming],
            ], 413);
        }

        return $next($request);
    }
}
