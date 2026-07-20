<?php

declare(strict_types=1);

namespace Academorix\Branding\Console;

use Academorix\Branding\Database\Seeders\BrandingPermissionSeeder;
use Academorix\Console\Attributes\AsCommand;
use Academorix\Console\Commands\BaseCommand;
use Illuminate\Contracts\Foundation\Application;

/**
 * `php artisan branding:seed-defaults` — dev helper that runs the
 * branding permission seeder. Refuses in production.
 *
 * @category Branding
 *
 * @since    0.1.0
 */
#[AsCommand(
    name: 'branding:seed-defaults',
    description: 'Seed branding permissions (dev / local only).',
)]
final class BrandingSeedDefaultsCommand extends BaseCommand
{
    /**
     * @var string
     */
    protected $signature = 'branding:seed-defaults';

    public function handle(Application $app, BrandingPermissionSeeder $permissions): int
    {
        $this->omni->titleBar('Seed Branding Defaults', 'emerald');

        if ($app->isProduction()) {
            $this->omni->error('Refused — branding:seed-defaults never runs in production.');
            $this->showDuration();

            return self::FAILURE;
        }

        $this->omni->task('Seeding BrandingPermission cases …', function () use ($permissions): array {
            $permissions->run();

            return ['state' => 'success', 'message' => 'permissions synced'];
        });

        $this->omni->success('Branding defaults seeded.');
        $this->showDuration();

        return self::SUCCESS;
    }
}
