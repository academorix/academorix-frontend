<?php

declare(strict_types=1);

namespace Stackra\Notifications\Console;

use Stackra\Console\Attributes\AsCommand;
use Stackra\Console\Commands\BaseCommand;
use Stackra\Notifications\Jobs\ReconcileDeliveriesJob;

/**
 * `php artisan notifications:reconcile-deliveries` — poll every
 * channel module's reconciliation endpoint for missed delivery
 * events.
 *
 * @category Notifications
 *
 * @since    0.1.0
 */
#[AsCommand(
    name: 'notifications:reconcile-deliveries',
    description: 'Poll channel modules for delivery events missed by webhooks.',
)]
final class NotificationsReconcileDeliveriesCommand extends BaseCommand
{
    /**
     * @var string
     */
    protected $signature = 'notifications:reconcile-deliveries
        {--lookback=1h : Lookback window (`1h`, `30m`, `2h`)}
        {--channel= : Restrict to one channel}
        {--dry-run : Preview without writing}';

    public function handle(): int
    {
        $this->omni->titleBar('Reconcile Deliveries', 'sky');

        $lookback = (string) $this->option('lookback');
        $channel  = $this->option('channel');

        ReconcileDeliveriesJob::dispatch(
            $lookback,
            \is_string($channel) && $channel !== '' ? $channel : null,
        );

        $this->omni->success(\sprintf(
            'Dispatched reconcile job (lookback=%s%s).',
            $lookback,
            \is_string($channel) && $channel !== '' ? ", channel={$channel}" : '',
        ));
        $this->showDuration();

        return self::SUCCESS;
    }
}
