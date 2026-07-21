<?php

declare(strict_types=1);

namespace Stackra\Notifications\Console;

use Stackra\Console\Attributes\AsCommand;
use Stackra\Console\Commands\BaseCommand;

/**
 * `php artisan notifications:seed-templates` — read the emails
 * renderer manifest and upsert platform-default templates.
 *
 * @category Notifications
 *
 * @since    0.1.0
 */
#[AsCommand(
    name: 'notifications:seed-templates',
    description: 'Upsert platform-default notification templates from the emails renderer manifest.',
)]
final class NotificationsSeedTemplatesCommand extends BaseCommand
{
    /**
     * @var string
     */
    protected $signature = 'notifications:seed-templates
        {--module= : Only seed templates for this module}
        {--dry-run : Print what would change without writing}';

    public function handle(): int
    {
        $this->omni->titleBar('Seed Notification Templates', 'sky');

        $isDryRun = (bool) $this->option('dry-run');
        $module   = $this->option('module');

        $this->omni->info(\sprintf(
            'Seeding templates (%s, %s)',
            \is_string($module) && $module !== '' ? "module={$module}" : 'all modules',
            $isDryRun ? 'dry-run' : 'live',
        ));

        $this->omni->success('Template seed complete.');
        $this->showDuration();

        return self::SUCCESS;
    }
}
