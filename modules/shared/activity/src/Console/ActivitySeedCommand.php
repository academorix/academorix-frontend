<?php

declare(strict_types=1);

namespace Academorix\Activity\Console;

use Academorix\Activity\Models\Activity;
use Academorix\Console\Attributes\AsCommand;
use Academorix\Console\Console\Commands\BaseCommand;
use Illuminate\Contracts\Foundation\Application;

/**
 * `php artisan activity:seed` — dev helper that seeds a handful of
 * sample `activity_log` rows for feed-UI testing.
 *
 * Refuses in production — the whole point is to write throw-away rows
 * so the feed UI has something to render during local development.
 *
 * @category Activity
 *
 * @since    0.1.0
 */
#[AsCommand(
    name: 'activity:seed',
    description: 'Seed sample activity_log rows (dev / local only).',
)]
final class ActivitySeedCommand extends BaseCommand
{
    /**
     * @var string
     */
    protected $signature = 'activity:seed
        {--count=10 : How many sample rows to create}';

    public function handle(Application $app): int
    {
        $this->omni->titleBar('Seed Activity Log', 'sky');

        if ($app->isProduction()) {
            $this->omni->error('Refused — activity:seed never runs in production.');
            $this->showDuration();

            return self::FAILURE;
        }

        $countRaw = $this->option('count');
        $count    = \is_numeric($countRaw) ? \max(1, (int) $countRaw) : 10;

        $this->omni->task(
            \sprintf('Creating %d sample activity rows …', $count),
            function () use ($count): array {
                Activity::factory()->count($count)->create();

                return ['state' => 'success', 'message' => \sprintf('%d rows created', $count)];
            },
        );

        $this->omni->success(\sprintf('Seeded %d activity rows.', $count));
        $this->showDuration();

        return self::SUCCESS;
    }
}
