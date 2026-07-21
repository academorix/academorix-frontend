<?php

declare(strict_types=1);

namespace Stackra\Storage\Jobs;

use Stackra\Storage\Contracts\Data\FileInterface;
use Stackra\Storage\Models\File;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\Attributes\Queue;
use Illuminate\Queue\Attributes\Timeout;
use Illuminate\Queue\Attributes\Tries;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

/**
 * Reconcile a tenant's storage usage against the entitlements
 * package.
 *
 * Sums every File.size_bytes for the tenant and writes the total
 * back to `storage.bytes.consumed`. Dispatched after every upload
 * + on a nightly schedule (`storage:reconcile-quota`).
 *
 * Body is a STUB — the concrete entitlements client is expected to
 * be swapped in at the application layer. The job leaves the
 * skeleton in place so listeners + tests can be exercised end-to-end.
 *
 * @category Storage
 *
 * @since    0.1.0
 */
#[Queue('entitlements')]
#[Timeout(120)]
#[Tries(3)]
final class SyncStorageEntitlementUsageJob implements ShouldQueue
{
    use Dispatchable;
    use InteractsWithQueue;
    use Queueable;
    use SerializesModels;

    public function __construct(public readonly string $tenantId)
    {
    }

    public function handle(): void
    {
        // Compute the aggregate — a cross-tenant scan bypasses the
        // BelongsToTenant global scope by design (the caller is a
        // maintenance job, not a per-tenant read path).
        $bytes = (int) File::query()
            ->withoutGlobalScopes()
            ->where(FileInterface::ATTR_TENANT_ID, $this->tenantId)
            ->sum(FileInterface::ATTR_SIZE_BYTES);

        $files = (int) File::query()
            ->withoutGlobalScopes()
            ->where(FileInterface::ATTR_TENANT_ID, $this->tenantId)
            ->count();

        $bytesKey = (string) \config('storage.entitlements.quota_bytes', 'storage.bytes.consumed');
        $filesKey = (string) \config('storage.entitlements.quota_files', 'storage.files.consumed');

        // Stub — a real entitlements client writes these two counts
        // via `EntitlementUsageInterface::report($tenantId, $key,
        // $count)`. Left as-is until the entitlements SDK is wired.
        \unset($bytesKey, $filesKey, $bytes, $files);
    }

    public function failed(\Throwable $e): void
    {
        // Report via monitoring — quota drift auto-corrects on the
        // next scheduled run.
    }
}
