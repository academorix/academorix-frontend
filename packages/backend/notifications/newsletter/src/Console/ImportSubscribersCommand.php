<?php

declare(strict_types=1);

namespace Academorix\Newsletter\Console;

use Academorix\Console\Attributes\AsCommand;
use Academorix\Console\Console\Commands\BaseCommand;
use Academorix\Newsletter\Jobs\ImportSubscribersJob;

/**
 * `php artisan newsletter:import-subscribers` — dispatch a CSV
 * import job.
 *
 * @category Newsletter
 *
 * @since    0.1.0
 */
#[AsCommand(
    name: 'newsletter:import-subscribers',
    description: 'Import subscribers into a newsletter from a CSV file.',
)]
final class ImportSubscribersCommand extends BaseCommand
{
    /**
     * @var string
     */
    protected $signature = 'newsletter:import-subscribers
        {newsletter : The newsletter id (nlp_...) to import into}
        {file : Absolute path to the CSV file}
        {--dry-run : Preview without writing}';

    /**
     * Execute the command.
     */
    public function handle(): int
    {
        $this->omni->titleBar('Newsletter — Import Subscribers', 'sky');

        $newsletterId = (string) $this->argument('newsletter');
        $file         = (string) $this->argument('file');

        if ($newsletterId === '' || $file === '') {
            $this->omni->error('newsletter id and file are required.');
            $this->showDuration();

            return self::FAILURE;
        }

        if ((bool) $this->option('dry-run')) {
            $this->omni->info('Dry-run mode — job not dispatched.');
            $this->showDuration();

            return self::SUCCESS;
        }

        ImportSubscribersJob::dispatch($newsletterId, $file);

        $this->omni->success(\sprintf(
            'Dispatched import job for newsletter "%s" (file: %s).',
            $newsletterId,
            $file,
        ));
        $this->showDuration();

        return self::SUCCESS;
    }
}
