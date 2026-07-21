<?php

declare(strict_types=1);

namespace Stackra\Notifications\Jobs;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldBeUnique;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\Attributes\Queue;
use Illuminate\Queue\Attributes\Tries;
use Illuminate\Queue\Attributes\UniqueFor;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

/**
 * Poll every channel module's reconciliation endpoint for delivery
 * events missed by webhooks.
 *
 * @category Notifications
 *
 * @since    0.1.0
 */
#[Queue('notifications')]
#[Tries(2)]
final class ReconcileDeliveriesJob implements ShouldBeUnique, ShouldQueue
{
    use Dispatchable;
    use InteractsWithQueue;
    use Queueable;
    use SerializesModels;

    /**
     * @param  string       $lookback  Lookback window (e.g. `1h`).
     * @param  string|null  $channel   Restrict to one channel.
     */
    public function __construct(
        public readonly string $lookback = '1h',
        public readonly ?string $channel = null,
    ) {
    }

    #[UniqueFor(3600)]
    public function uniqueId(): string
    {
        return 'reconcile:' . ($this->channel ?? 'all') . ':' . $this->lookback;
    }

    /**
     * Trigger channel-module reconciliation.
     *
     * The concrete polling logic lives in channel modules — this
     * job coordinates the fan-out.
     */
    public function handle(): void
    {
    }

    public function failed(\Throwable $e): void
    {
    }
}
