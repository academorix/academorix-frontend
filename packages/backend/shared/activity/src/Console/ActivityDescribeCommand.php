<?php

declare(strict_types=1);

namespace Academorix\Activity\Console;

use Academorix\Activity\Contracts\Services\ActivityRegistryInterface;
use Academorix\Console\Attributes\AsCommand;
use Academorix\Console\Console\Commands\BaseCommand;

/**
 * `php artisan activity:describe` — print the compile-time inventory of
 * every model class registered with the {@see ActivityRegistryInterface}.
 *
 * The registry is hydrated at boot by the framework's generic
 * hydration pump ({@see \Academorix\ServiceProvider\Bootstrappers\HydrationBootstrapper})
 * via the `#[HydratesFrom(LoggableActivity::class)]` declaration on
 * {@see ActivityRegistryInterface::register()}. Every class carrying
 * `#[LoggableActivity]` lands in the registry — this command is the
 * operator's view onto that inventory.
 *
 * @category Activity
 *
 * @since    0.1.0
 */
#[AsCommand(
    name: 'activity:describe',
    description: 'Print every model class registered with the activity feed.',
)]
final class ActivityDescribeCommand extends BaseCommand
{
    public function handle(ActivityRegistryInterface $registry): int
    {
        $this->omni->titleBar('Activity Registry', 'emerald');

        $classes = $registry->all();

        if ($classes === []) {
            $this->omni->info('No models are registered with the activity feed.');
            $this->omni->info('Compose HasActivityLog and add #[LoggableActivity] to opt in.');
            $this->showDuration();

            return self::SUCCESS;
        }

        $this->omni->tableHeader('#', 'Model class');

        foreach ($classes as $index => $className) {
            // 1-indexed row numbers read more naturally in a CLI table
            // than 0-indexed — matches every other `describe` output.
            $this->omni->tableRow((string) ($index + 1), $className);
        }

        $this->omni->success(\sprintf('%d model(s) registered.', \count($classes)));
        $this->showDuration();

        return self::SUCCESS;
    }
}
