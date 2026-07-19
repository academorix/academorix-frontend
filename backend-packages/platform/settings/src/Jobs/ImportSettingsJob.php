<?php

declare(strict_types=1);

namespace Academorix\Settings\Jobs;

use Academorix\Settings\Contracts\Services\SettingsWriterInterface;
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
 * Validate + upsert a previously-exported settings payload.
 *
 * Every key runs through the writer so per-field validation rules
 * fire and every write dispatches a
 * {@see \Academorix\Settings\Events\SettingsChangeEvent} — the import
 * is auditable end-to-end.
 *
 * @category Settings
 *
 * @since    0.1.0
 */
#[Queue('default')]
#[Timeout(300)]
#[Tries(2)]
final class ImportSettingsJob implements ShouldQueue
{
    use Dispatchable;
    use InteractsWithQueue;
    use Queueable;
    use SerializesModels;

    /**
     * @param  string                $tenantId  Tenant that owns the import.
     * @param  array<string, mixed>  $payload   Key → value pairs to upsert.
     */
    public function __construct(
        public readonly string $tenantId,
        public readonly array $payload,
    ) {
    }

    public function handle(SettingsWriterInterface $writer): void
    {
        foreach ($this->payload as $key => $value) {
            $writer->write(
                (string) $key,
                $value,
                SettingScopeKind::Tenant->value,
                $this->tenantId,
            );
        }
    }

    public function failed(\Throwable $e): void
    {
    }
}
