<?php

declare(strict_types=1);

namespace Academorix\Notifications\Jobs;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\Attributes\Queue;
use Illuminate\Queue\Attributes\Tries;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

/**
 * The orchestrator job — called once per dispatch.
 *
 * Resolves preferences, digest mode, and channels; creates
 * `NotificationDelivery` rows; fires `NotificationDispatched` per
 * resolved channel. Channel modules pick up the event and translate
 * to their transport.
 *
 * @category Notifications
 *
 * @since    0.1.0
 */
#[Queue('notifications')]
#[Tries(1)]
final class SendNotificationJob implements ShouldQueue
{
    use Dispatchable;
    use InteractsWithQueue;
    use Queueable;
    use SerializesModels;

    /**
     * @param  string  $notificationId  The parent notification id.
     */
    public function __construct(public readonly string $notificationId)
    {
    }

    /**
     * Execute the orchestration.
     *
     * The orchestrator resolves preferences via
     * `NotificationPreferenceResolverInterface`, resolves channels
     * via `NotificationChannelRegistry`, and fires per-channel
     * events. The concrete resolution logic lands in a follow-up
     * slice — this shell keeps the wire contract stable.
     */
    public function handle(): void
    {
    }

    /**
     * No-op on failure — the orchestrator is thin, retries live on
     * channel modules.
     */
    public function failed(\Throwable $e): void
    {
    }
}
