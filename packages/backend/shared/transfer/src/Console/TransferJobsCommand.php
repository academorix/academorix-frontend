<?php

declare(strict_types=1);

namespace Stackra\Transfer\Console;

use Stackra\Console\Attributes\AsCommand;
use Stackra\Console\Commands\BaseCommand;
use Stackra\Transfer\Contracts\Data\XferJobInterface;
use Stackra\Transfer\Contracts\Repositories\XferJobRepositoryInterface;

/**
 * `php artisan transfer:jobs` — list xfer_jobs for support triage.
 *
 * @category Transfer
 *
 * @since    0.1.0
 */
#[AsCommand(
    name: 'transfer:jobs',
    description: 'List transfer jobs — platform-admin observability.',
)]
final class TransferJobsCommand extends BaseCommand
{
    /**
     * @var string
     */
    protected $signature = 'transfer:jobs {--limit=50} {--json}';

    public function handle(XferJobRepositoryInterface $jobs): int
    {
        $this->omni->titleBar('Transfer Jobs', 'sky');

        $rows = $jobs->paginate((int) $this->option('limit'))->getCollection();
        $this->omni->tableHeader('#', 'ID', 'Kind', 'Entity', 'Status');
        foreach ($rows as $index => $job) {
            $this->omni->tableRow(
                (string) ($index + 1),
                (string) $job->getKey(),
                (string) $job->{XferJobInterface::ATTR_KIND}?->value,
                (string) $job->{XferJobInterface::ATTR_ENTITY_KEY},
                (string) $job->{XferJobInterface::ATTR_STATUS}?->value,
            );
        }

        $this->omni->success(\sprintf('%d job(s) listed.', $rows->count()));
        $this->showDuration();

        return self::SUCCESS;
    }
}
