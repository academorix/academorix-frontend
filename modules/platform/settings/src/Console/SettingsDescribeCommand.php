<?php

declare(strict_types=1);

namespace Academorix\Settings\Console;

use Academorix\Console\Attributes\AsCommand;
use Academorix\Console\Console\Commands\BaseCommand;
use Academorix\Settings\Contracts\Services\SettingsRegistryInterface;

/**
 * `php artisan settings:describe {--group=}` — pretty-print every
 * registered settings group + its fields.
 *
 * Handy for onboarding + verifying that a newly-added `#[AsSetting]`
 * class was picked up by the discovery pass. When `--group=<slug>`
 * is given, output narrows to that group.
 *
 * @category Settings
 *
 * @since    0.1.0
 */
#[AsCommand(
    name: 'settings:describe',
    description: 'Describe registered settings groups + their fields.',
)]
final class SettingsDescribeCommand extends BaseCommand
{
    /**
     * @var string
     */
    protected $signature = 'settings:describe {--group= : Limit output to a single group slug}';

    public function handle(SettingsRegistryInterface $registry): int
    {
        $this->omni->titleBar('Describe Settings', 'sky');

        $filter = (string) ($this->option('group') ?? '');
        $groups = $registry->groups();

        if ($filter !== '') {
            $groups = isset($groups[$filter]) ? [$filter => $groups[$filter]] : [];
        }

        if ($groups === []) {
            $this->omni->info('No settings groups registered.');
            $this->showDuration();

            return self::SUCCESS;
        }

        foreach ($groups as $key => $meta) {
            $this->omni->divider(\sprintf('%s — %s', $key, $meta['label'] ?? $key));

            $this->omni->tableHeader('Field', 'Type', 'Sensitive', 'Default');

            foreach ($registry->fields((string) $key) as $field) {
                $this->omni->tableRow(
                    (string) ($field['key'] ?? '—'),
                    (string) ($field['type'] ?? 'string'),
                    ($field['sensitive'] ?? false) ? 'yes' : 'no',
                    (string) \json_encode($field['default'] ?? null),
                );
            }
        }

        $this->omni->success('Registered groups listed.');
        $this->showDuration();

        return self::SUCCESS;
    }
}
