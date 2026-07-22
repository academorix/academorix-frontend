<?php

declare(strict_types=1);

namespace Stackra\Versioning\Console;

use Stackra\Console\Attributes\AsCommand;
use Stackra\Console\Commands\BaseCommand;
use Stackra\Versioning\Contracts\Registry\PayloadTransformerRegistryInterface;

/**
 * `php artisan versioning:transformers` — table view of every
 * registered `#[AsPayloadTransformer]` in the app.
 *
 * @category Versioning
 *
 * @since    0.1.0
 */
#[AsCommand(
    name: 'versioning:transformers',
    description: 'List every registered payload transformer.',
)]
final class VersioningTransformersCommand extends BaseCommand
{
    public function handle(PayloadTransformerRegistryInterface $registry): int
    {
        $this->omni->titleBar('Payload Transformers', 'sky');

        $rows = $registry->all();
        if ($rows === []) {
            $this->omni->info('No payload transformers registered.');
            $this->showDuration();

            return self::SUCCESS;
        }

        $this->omni->tableHeader('Surface', 'Event', 'From', 'To', 'Class');
        foreach ($rows as $row) {
            $this->omni->tableRow(
                $row['surface'],
                $row['event'],
                $row['from'],
                $row['to'],
                $row['class'],
            );
        }

        $this->omni->success(\sprintf('%d transformer(s).', \count($rows)));
        $this->showDuration();

        return self::SUCCESS;
    }
}
