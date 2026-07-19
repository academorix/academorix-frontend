<?php

declare(strict_types=1);

namespace Academorix\Application\Console;

use Academorix\Application\Database\Seeders\BusinessTypeSeeder;
use Academorix\Console\Attributes\AsCommand;
use Academorix\Console\Console\Commands\BaseCommand;

/**
 * `php artisan application:sync-catalogue` — idempotent mirror of
 * `BusinessTypeEnum::cases()` into `business_types`. Safe to run on
 * every deploy; upserts by `(tenant_id, slug)`.
 *
 * Extends {@see BaseCommand} (per `.kiro/steering/console-commands.md`)
 * for the OmniTerm output surface. Deps arrive via method injection on
 * `handle()` so `php artisan list` doesn't instantiate the seeder.
 *
 * @category Application
 *
 * @since    0.1.0
 */
#[AsCommand(
    name: 'application:sync-catalogue',
    description: 'Mirror BusinessTypeEnum::cases() into the business_types table. Idempotent.',
)]
final class SyncCatalogueCommand extends BaseCommand
{
    /**
     * Command signature — argument/option DSL only. `name` +
     * `description` are canonical on `#[AsCommand]`.
     */
    protected $signature = 'application:sync-catalogue {--dry-run : Preview the sync without writes}';

    /**
     * Mirror the enum into the table.
     *
     * @param  BusinessTypeSeeder  $seeder  Injected via `handle()` — a
     *                                       plain Laravel seeder (also
     *                                       runs from `db:seed`).
     * @return int  Exit status.
     */
    public function handle(BusinessTypeSeeder $seeder): int
    {
        $this->omni->titleBar('Sync BusinessType Catalogue', 'sky');

        if ($this->option('dry-run') === true) {
            $this->omni->info(
                'Dry-run — no writes. Would upsert every BusinessTypeEnum case (except Custom).',
            );
            $this->showDuration();

            return self::SUCCESS;
        }

        // Wrap the seeder in a spinner-backed task — the seeder's own
        // logging is quiet, so OmniTerm's spinner is the visible signal
        // that work is happening.
        $this->omni->task(
            'Syncing BusinessType catalogue',
            static function () use ($seeder): array {
                $seeder->run();

                return ['state' => 'success', 'message' => 'Sync complete.'];
            },
        );

        $this->omni->success('BusinessType catalogue mirrored to `business_types`.');
        $this->showDuration();

        return self::SUCCESS;
    }
}
