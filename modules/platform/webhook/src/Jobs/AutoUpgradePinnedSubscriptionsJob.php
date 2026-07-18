<?php

declare(strict_types=1);

namespace Academorix\Webhook\Jobs;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\Attributes\Queue;
use Illuminate\Queue\Attributes\Timeout;
use Illuminate\Queue\Attributes\Tries;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Psr\Log\LoggerInterface;

/**
 * Auto-migrates pinned `api_version` subscriptions when their version
 * is sunset per the versioning module's rules.
 *
 * Stub — logs and no-ops when the versioning module is not present in
 * the container. Consumer apps that ship the versioning module will
 * override this behaviour or extend the job.
 *
 * @category Webhook
 *
 * @since    0.1.0
 */
#[Queue('default')]
#[Timeout(300)]
#[Tries(2)]
final class AutoUpgradePinnedSubscriptionsJob implements ShouldQueue
{
    use Dispatchable;
    use InteractsWithQueue;
    use Queueable;
    use SerializesModels;

    public function handle(LoggerInterface $log): void
    {
        // The versioning module owns the sunset schedule. When present,
        // it exposes a resolver we can query for expired versions +
        // recommended upgrades. Until then the job is a no-op stub so
        // scheduled runs don't error out.
        $log->info('AutoUpgradePinnedSubscriptionsJob: versioning module not present, no-op.');
    }

    public function failed(\Throwable $e): void
    {
    }
}
