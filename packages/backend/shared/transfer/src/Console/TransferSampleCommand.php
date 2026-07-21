<?php

declare(strict_types=1);

namespace Stackra\Transfer\Console;

use Stackra\Console\Attributes\AsCommand;
use Stackra\Console\Commands\BaseCommand;
use Stackra\Transfer\Contracts\Data\XferJobInterface;
use Stackra\Transfer\Contracts\Repositories\XferJobRepositoryInterface;
use Stackra\Transfer\Enums\XferKind;
use Stackra\Transfer\Jobs\GenerateSampleDataJob;

/**
 * `php artisan transfer:sample` — generate sample data for a
 * `#[SampleData]`-annotated entity.
 *
 * @category Transfer
 *
 * @since    0.1.0
 */
#[AsCommand(
    name: 'transfer:sample',
    description: 'Generate sample rows for a registered entity.',
)]
final class TransferSampleCommand extends BaseCommand
{
    /**
     * @var string
     */
    protected $signature = 'transfer:sample {entity} {--count=10} {--sync}';

    public function handle(XferJobRepositoryInterface $jobs): int
    {
        $this->omni->titleBar('Transfer Sample', 'sky');

        /** @var \Stackra\Transfer\Models\XferJob $job */
        $job = $jobs->create([
            XferJobInterface::ATTR_KIND       => XferKind::Sample->value,
            XferJobInterface::ATTR_ENTITY_KEY => (string) $this->argument('entity'),
            XferJobInterface::ATTR_METADATA   => ['count' => (int) $this->option('count')],
        ]);

        GenerateSampleDataJob::dispatch((string) $job->getKey());
        $this->omni->success(\sprintf('Sample job dispatched: %s', (string) $job->getKey()));
        $this->showDuration();

        return self::SUCCESS;
    }
}
