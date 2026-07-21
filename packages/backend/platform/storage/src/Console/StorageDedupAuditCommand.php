<?php

declare(strict_types=1);

namespace Stackra\Storage\Console;

use Stackra\Console\Attributes\AsCommand;
use Stackra\Console\Commands\BaseCommand;
use Stackra\Storage\Contracts\Services\ContentAddressableStoreInterface;

/**
 * `php artisan storage:dedup-audit` — synchronously reconcile the
 * blob store against the File rows. Reports orphan counts. Use
 * `--dry-run` to avoid physical deletes.
 *
 * @category Storage
 *
 * @since    0.1.0
 */
#[AsCommand(
    name: 'storage:dedup-audit',
    description: 'Report + reconcile orphan physical blobs.',
)]
final class StorageDedupAuditCommand extends BaseCommand
{
    /**
     * @var string
     */
    protected $signature = 'storage:dedup-audit {--dry-run : Only report orphan counts, do not delete}';

    public function handle(ContentAddressableStoreInterface $blobs): int
    {
        $this->omni->titleBar('Storage — Dedup Audit', 'sky');

        $dryRun = (bool) $this->option('dry-run');

        $orphans = $this->omni->task('Walking every configured disk …', static function () use ($blobs, $dryRun): array {
            $n = $blobs->reconcileOrphans($dryRun);

            return ['state' => 'success', 'message' => \sprintf('%d orphan(s) found', $n), 'orphans' => $n];
        });

        /** @var int $count */
        $count = (int) ($orphans['orphans'] ?? 0);

        $this->omni->tableHeader('Metric', 'Value');
        $this->omni->tableRow('mode', $dryRun ? 'dry-run' : 'live');
        $this->omni->tableRow('orphans', (string) $count);

        $this->omni->success($dryRun ? 'Dedup audit (dry-run) complete.' : 'Dedup audit complete.');
        $this->showDuration();

        return self::SUCCESS;
    }
}
