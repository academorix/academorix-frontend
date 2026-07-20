<?php

declare(strict_types=1);

namespace Academorix\Localization\Console;

use Academorix\Console\Attributes\AsCommand;
use Academorix\Console\Console\Commands\BaseCommand;
use Academorix\Localization\Database\Seeders\PlatformLanguageSeeder;

/**
 * `php artisan localization:seed-platform-languages` — seed the
 * platform-language catalogue with ~30 common BCP-47 tags.
 *
 * Requires `php artisan world:install` to have run first — the
 * seeder skips silently when the geography tables are empty.
 *
 * @category Localization
 *
 * @since    0.1.0
 */
#[AsCommand(
    name: 'localization:seed-platform-languages',
    description: 'Seed the platform-language catalogue from the geography module.',
)]
final class SeedPlatformLanguagesCommand extends BaseCommand
{
    /**
     * @var string
     */
    protected $signature = 'localization:seed-platform-languages {--refresh}';

    public function handle(PlatformLanguageSeeder $seeder): int
    {
        $this->omni->titleBar('Seed Platform Languages', 'emerald');

        $seeder->run();

        $this->omni->success('Platform-language catalogue seeded.');
        $this->showDuration();

        return self::SUCCESS;
    }
}
