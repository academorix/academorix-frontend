<?php

declare(strict_types=1);

namespace Stackra\Newsletter\Console;

use Stackra\Console\Attributes\AsCommand;
use Stackra\Console\Commands\BaseCommand;
use Stackra\Newsletter\Jobs\ExportSubscribersJob;

/**
 * `php artisan newsletter:export-subscribers` — dispatch a CSV
 * export job.
 *
 * @category Newsletter
 *
 * @since    0.1.0
 */
#[AsCommand(
    name: 'newsletter:export-subscribers',
    description: 'Export subscribers of a newsletter to CSV.',
)]
final class ExportSubscribersCommand extends BaseCommand
{
    /**
     * @var string
     */
    protected $signature = 'newsletter:export-subscribers
        {newsletter : The newsletter id (nlp_...) to export}
        {--filter= : Optional JSON filter}
        {--out= : Optional output path (defaults to storage/exports)}';

    /**
     * Execute the command.
     */
    public function handle(): int
    {
        $this->omni->titleBar('Newsletter — Export Subscribers', 'sky');

        $newsletterId = (string) $this->argument('newsletter');
        if ($newsletterId === '') {
            $this->omni->error('newsletter id is required.');
            $this->showDuration();

            return self::FAILURE;
        }

        $filterOption = (string) ($this->option('filter') ?? '');
        $filter       = [];
        if ($filterOption !== '') {
            /** @var mixed $decoded */
            $decoded = \json_decode($filterOption, true);
            $filter  = \is_array($decoded) ? $decoded : [];
        }

        ExportSubscribersJob::dispatch($newsletterId, $filter);

        $this->omni->success(\sprintf(
            'Dispatched export job for newsletter "%s".',
            $newsletterId,
        ));
        $this->showDuration();

        return self::SUCCESS;
    }
}
