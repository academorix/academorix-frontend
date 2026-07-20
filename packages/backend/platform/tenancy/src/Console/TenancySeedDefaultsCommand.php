<?php

declare(strict_types=1);

namespace Academorix\Tenancy\Console;

use Academorix\Console\Attributes\AsCommand;
use Academorix\Console\Console\Commands\BaseCommand;
use Academorix\Tenancy\Database\Seeders\TenancyPermissionSeeder;
use Illuminate\Contracts\Foundation\Application;

/**
 * `php artisan tenancy:seed-defaults` — dev helper that runs the
 * tenancy seeders (permissions + roles) without touching the whole
 * `db:seed` chain.
 *
 * NEVER runs in production — guarded by `app()->isProduction()`.
 *
 * @category Tenancy
 *
 * @since    0.1.0
 */
#[AsCommand(
    name: 'tenancy:seed-defaults',
    description: 'Seed tenancy permissions + roles (dev / local only).',
)]
final class TenancySeedDefaultsCommand extends BaseCommand
{
    /**
     * @var string
     */
    protected $signature = 'tenancy:seed-defaults {--fresh : Fresh seed (idempotent already, but resets timestamps)}';

    /**
     * Seed the tenancy defaults. Refuses in production.
     */
    public function handle(Application $app, TenancyPermissionSeeder $permissions): int
    {
        $this->omni->titleBar('Seed Tenancy Defaults', 'emerald');

        if ($app->isProduction()) {
            $this->omni->error('Refused — tenancy:seed-defaults never runs in production.');
            $this->showDuration();

            return self::FAILURE;
        }

        $this->omni->task('Seeding TenancyPermission cases …', function () use ($permissions): array {
            $permissions->run();

            return ['state' => 'success', 'message' => 'permissions synced'];
        });

        $this->omni->success('Tenancy defaults seeded.');
        $this->showDuration();

        return self::SUCCESS;
    }
}
