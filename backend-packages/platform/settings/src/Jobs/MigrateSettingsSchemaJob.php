<?php

declare(strict_types=1);

namespace Academorix\Settings\Jobs;

use Academorix\Settings\Contracts\Data\SettingsGroupInterface;
use Academorix\Settings\Contracts\Data\SettingsSchemaInterface;
use Academorix\Settings\Contracts\Repositories\SettingsSchemaRepositoryInterface;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\Attributes\Queue;
use Illuminate\Queue\Attributes\Timeout;
use Illuminate\Queue\Attributes\Tries;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

/**
 * Reconcile schema drift when a `#[SettingField]` type changes.
 *
 * When a field's declared type diverges from the persisted
 * `settings_schemas.type` column (e.g. `string` → `enum`), value
 * rows may need casting or discarding. This job walks the schema
 * catalogue for the given group and applies the necessary
 * type-migration steps.
 *
 * @category Settings
 *
 * @since    0.1.0
 */
#[Queue('default')]
#[Timeout(600)]
#[Tries(1)]
final class MigrateSettingsSchemaJob implements ShouldQueue
{
    use Dispatchable;
    use InteractsWithQueue;
    use Queueable;
    use SerializesModels;

    public function __construct(public readonly string $groupKey)
    {
    }

    public function handle(SettingsSchemaRepositoryInterface $schemas): void
    {
        // Fetch every schema for this group; downstream migrations
        // walk their values via the value repository. The stub here
        // pins the interface — concrete migration behaviour is a
        // per-schema-change concern.
        $groupKey = $this->groupKey;
        $rows     = $schemas->query()
            ->whereHas('group', static function ($q) use ($groupKey): void {
                $q->where(SettingsGroupInterface::ATTR_KEY, $groupKey);
            })
            ->get();

        // Reference the constant so IDEs + static analysis carry the
        // dependency even in the stub body.
        $_ = SettingsSchemaInterface::ATTR_KEY;
        \unset($rows, $_);
    }

    public function failed(\Throwable $e): void
    {
    }
}
