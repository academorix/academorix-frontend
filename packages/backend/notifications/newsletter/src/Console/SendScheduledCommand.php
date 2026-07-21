<?php

declare(strict_types=1);

namespace Stackra\Newsletter\Console;

use Stackra\Console\Attributes\AsCommand;
use Stackra\Console\Commands\BaseCommand;
use Stackra\Newsletter\Contracts\Repositories\NewsletterCampaignRepositoryInterface;
use Stackra\Newsletter\Jobs\SendNewsletterCampaignJob;

/**
 * `php artisan newsletter:send-scheduled` — dispatch orchestrators
 * for every campaign whose `scheduled_at` is due.
 *
 * Meant to run from Laravel's scheduler on a short cadence (every
 * minute). Each due campaign becomes a dispatched
 * {@see SendNewsletterCampaignJob}.
 *
 * @category Newsletter
 *
 * @since    0.1.0
 */
#[AsCommand(
    name: 'newsletter:send-scheduled',
    description: 'Dispatch orchestrators for every due newsletter campaign.',
)]
final class SendScheduledCommand extends BaseCommand
{
    /**
     * Execute the command.
     */
    public function handle(NewsletterCampaignRepositoryInterface $campaigns): int
    {
        $this->omni->titleBar('Newsletter — Send Scheduled', 'sky');

        $due = $campaigns->findDueForSend(\now());
        $dispatched = 0;

        foreach ($due as $campaign) {
            SendNewsletterCampaignJob::dispatch((string) $campaign->getKey());
            $dispatched++;
        }

        $this->omni->success(\sprintf(
            'Dispatched %d campaign orchestration job(s).',
            $dispatched,
        ));
        $this->showDuration();

        return self::SUCCESS;
    }
}
