<?php

declare(strict_types=1);

namespace Academorix\Storage\Console;

use Academorix\Console\Attributes\AsCommand;
use Academorix\Console\Console\Commands\BaseCommand;
use Academorix\Storage\Contracts\Services\FileKindRegistryInterface;

/**
 * `php artisan storage:describe` — print the discovered
 * FileKind registry + disk config for the current environment.
 *
 * @category Storage
 *
 * @since    0.1.0
 */
#[AsCommand(
    name: 'storage:describe',
    description: 'Print discovered FileKind registry + storage disk map.',
)]
final class StorageDescribeCommand extends BaseCommand
{
    public function handle(FileKindRegistryInterface $kinds): int
    {
        $this->omni->titleBar('Storage — Describe', 'sky');

        $rows = $kinds->all();
        if ($rows === []) {
            $this->omni->info('No FileKind classes discovered — the registry is empty.');
            $this->showDuration();

            return self::SUCCESS;
        }

        $this->omni->tableHeader('Kind', 'Max MB', 'Allowed MIMEs', 'Variants');
        foreach ($rows as $key => $cfg) {
            /** @var array<int, string> $mimes */
            $mimes = (array) ($cfg['allowedMimes'] ?? []);
            /** @var array<int, string> $variants */
            $variants = (array) ($cfg['generatesVariants'] ?? []);
            $this->omni->tableRow(
                (string) $key,
                (string) ($cfg['maxSizeMb'] ?? '—'),
                \implode(', ', $mimes),
                \implode(', ', $variants),
            );
        }

        $this->omni->success(\sprintf('%d kind(s) registered.', \count($rows)));
        $this->showDuration();

        return self::SUCCESS;
    }
}
