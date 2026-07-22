<?php

declare(strict_types=1);

namespace Stackra\Transfer\Console;

use Stackra\Console\Attributes\AsCommand;
use Stackra\Console\Commands\BaseCommand;
use Stackra\Transfer\Contracts\Registry\EntityRegistryInterface;

/**
 * `php artisan transfer:describe` — dump the EntityRegistry.
 *
 * @category Transfer
 *
 * @since    0.1.0
 */
#[AsCommand(
    name: 'transfer:describe',
    description: 'Print every entity registered with the transfer engine.',
)]
final class TransferDescribeCommand extends BaseCommand
{
    /**
     * @var string
     */
    protected $signature = 'transfer:describe {entity?} {--json}';

    public function handle(EntityRegistryInterface $registry): int
    {
        $this->omni->titleBar('Transfer Registry', 'emerald');

        $entity = $this->argument('entity');

        if ($entity !== null) {
            $this->omni->info(\sprintf(
                'Importable model: %s',
                (string) ($registry->importableModel((string) $entity) ?? '(not registered)'),
            ));
            $this->omni->info(\sprintf(
                'Exportable model: %s',
                (string) ($registry->exportableModel((string) $entity) ?? '(not registered)'),
            ));
            $this->showDuration();

            return self::SUCCESS;
        }

        $this->omni->tableHeader('Bucket', 'Count');
        $this->omni->tableRow('Importable', (string) \count($registry->importableKeys()));
        $this->omni->tableRow('Exportable', (string) \count($registry->exportableKeys()));
        $this->omni->tableRow('Sampleable', (string) \count($registry->sampleableKeys()));
        $this->showDuration();

        return self::SUCCESS;
    }
}
