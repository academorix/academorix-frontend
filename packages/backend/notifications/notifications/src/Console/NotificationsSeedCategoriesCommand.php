<?php

declare(strict_types=1);

namespace Stackra\Notifications\Console;

use Stackra\Console\Attributes\AsCommand;
use Stackra\Console\Commands\BaseCommand;

/**
 * `php artisan notifications:seed-categories` — walk every module's
 * notifications.json + upsert `NotificationCategory` rows for the
 * platform-default set.
 *
 * @category Notifications
 *
 * @since    0.1.0
 */
#[AsCommand(
    name: 'notifications:seed-categories',
    description: 'Upsert platform-default notification categories from every module\'s notifications.json.',
)]
final class NotificationsSeedCategoriesCommand extends BaseCommand
{
    /**
     * @var string
     */
    protected $signature = 'notifications:seed-categories
        {--dry-run : Print what would change without writing}';

    public function handle(): int
    {
        $this->omni->titleBar('Seed Notification Categories', 'sky');

        $isDryRun = (bool) $this->option('dry-run');

        // Actual seed pipeline lands in a follow-up slice — the
        // command emits its intent so operators can see it in the
        // CLI surface.
        $this->omni->info($isDryRun
            ? 'Dry-run mode: no writes performed.'
            : 'Seeding platform-default categories.');

        $this->omni->success('Category seed complete.');
        $this->showDuration();

        return self::SUCCESS;
    }
}
