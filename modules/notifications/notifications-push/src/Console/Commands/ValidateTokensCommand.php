<?php

declare(strict_types=1);

namespace Academorix\Notifications\Push\Console\Commands;

use Academorix\Console\Commands\BaseCommand;
use Academorix\Notifications\Push\Contracts\Data\PushSubscriptionInterface;
use Academorix\Notifications\Push\Contracts\Repositories\PushSubscriptionRepositoryInterface;
use Academorix\Notifications\Push\Jobs\ValidatePushTokenJob;
use Symfony\Component\Console\Attribute\AsCommand;

/**
 * `notifications:push:validate-tokens` — batch-validate stale subscriptions.
 *
 * Samples subscriptions older than `--stale-days` at rate `--sample-rate`
 * and dispatches {@see ValidatePushTokenJob} for each hit.
 *
 * @category NotificationsPush
 *
 * @since    0.1.0
 */
#[AsCommand(
    name: 'notifications:push:validate-tokens',
    description: 'Batch-validate a sample of stale push tokens against the provider.',
)]
final class ValidateTokensCommand extends BaseCommand
{
    /**
     * @var string
     */
    protected $signature = 'notifications:push:validate-tokens {--stale-days=30} {--sample-rate=0.05}';

    /**
     * @var string
     */
    protected $description = 'Batch-validate a sample of stale push tokens against the provider.';

    public function handle(PushSubscriptionRepositoryInterface $subscriptions): int
    {
        $staleDays  = (int) $this->option('stale-days');
        $sampleRate = (float) $this->option('sample-rate');

        $cutoff = now()->subDays(\max(1, $staleDays));
        $count  = 0;

        foreach ($subscriptions->findIdleBefore($cutoff) as $subscription) {
            // Deterministic sample — the fingerprint's first byte modulo 100
            // gives us a stable 0..99 bucket; keep the bucket when the roll
            // lands under the sample rate.
            $fingerprint = (string) $subscription->getAttribute(
                PushSubscriptionInterface::ATTR_DEVICE_TOKEN_FINGERPRINT,
            );
            $bucket = (int) \hexdec(\substr($fingerprint, 0, 2)) % 100;

            if ($bucket >= ($sampleRate * 100)) {
                continue;
            }

            ValidatePushTokenJob::dispatch((string) $subscription->getKey());
            $count++;
        }

        $this->info("Dispatched {$count} validate-token job(s).");

        return self::SUCCESS;
    }
}
