<?php

declare(strict_types=1);

namespace Academorix\Webhook\Console;

use Academorix\Console\Attributes\AsCommand;
use Academorix\Console\Console\Commands\BaseCommand;
use Academorix\Webhook\Jobs\PruneWebhookDeliveriesJob;

/**
 * `php artisan webhook:prune {--days=90}` — dispatch the retention
 * job to drop old `webhook_deliveries` rows.
 *
 * @category Webhook
 *
 * @since    0.1.0
 */
#[AsCommand(
    name: 'webhook:prune',
    description: 'Prune webhook_deliveries rows older than the retention window.',
)]
final class WebhookPruneCommand extends BaseCommand
{
    /**
     * @var string
     */
    protected $signature = 'webhook:prune {--days= : Retention window in days (defaults to webhook.retention.delivery_days)}';

    public function handle(): int
    {
        $this->omni->titleBar('Prune Webhook Deliveries', 'sky');

        $daysOption = $this->option('days');
        $days = $daysOption !== null
            ? (int) $daysOption
            : (int) \config('webhook.retention.delivery_days', 90);

        if ($days < 1) {
            $this->omni->error('The retention window must be at least 1 day.');
            $this->showDuration();

            return self::FAILURE;
        }

        PruneWebhookDeliveriesJob::dispatch($days);

        $this->omni->success(\sprintf(
            'Dispatched retention job — will drop deliveries older than %d days.',
            $days,
        ));
        $this->showDuration();

        return self::SUCCESS;
    }
}
