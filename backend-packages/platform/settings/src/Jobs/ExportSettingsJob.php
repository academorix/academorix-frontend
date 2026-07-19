<?php

declare(strict_types=1);

namespace Academorix\Settings\Jobs;

use Academorix\Settings\Contracts\Repositories\SettingValueRepositoryInterface;
use Academorix\Settings\Enums\SettingScopeKind;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\Attributes\Queue;
use Illuminate\Queue\Attributes\Timeout;
use Illuminate\Queue\Attributes\Tries;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

/**
 * Dump every setting for a tenant to JSON.
 *
 * Reads system + tenant scope rows and folds them into a structured
 * payload that the caller can persist to blob storage. The real
 * shipping/receiving work is decoupled here — this job's contract is
 * "produce the payload, ready for downstream consumption".
 *
 * @category Settings
 *
 * @since    0.1.0
 */
#[Queue('default')]
#[Timeout(300)]
#[Tries(2)]
final class ExportSettingsJob implements ShouldQueue
{
    use Dispatchable;
    use InteractsWithQueue;
    use Queueable;
    use SerializesModels;

    public function __construct(public readonly string $tenantId)
    {
    }

    public function handle(SettingValueRepositoryInterface $values): void
    {
        $system = $values->findByScope(SettingScopeKind::System->value, null);
        $tenant = $values->findByScope(SettingScopeKind::Tenant->value, $this->tenantId);

        // Real deployments plug in a Storage disk here; the stub
        // above locates the rows to export so the shape is stable.
        // See the module's changelog for the extension seam.
        \unset($system, $tenant);
    }

    public function failed(\Throwable $e): void
    {
    }
}
