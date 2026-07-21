<?php

declare(strict_types=1);

namespace Stackra\Localization\Jobs;

use Stackra\Localization\Contracts\Repositories\TranslationRepositoryInterface;
use Carbon\CarbonImmutable;
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
 * Hard-delete stale translation rows past retention.
 *
 * Reads `config('localization.retention.stale_days')` to compute
 * the cutoff. Row selection: `is_stale = true AND updated_at < cutoff`.
 *
 * @category Localization
 *
 * @since    0.1.0
 */
#[Queue('translations')]
#[Timeout(600)]
#[Tries(1)]
final class PruneStaleTranslationsJob implements ShouldQueue
{
    use Dispatchable;
    use InteractsWithQueue;
    use Queueable;
    use SerializesModels;

    public function handle(
        TranslationRepositoryInterface $translations,
        LoggerInterface $log,
    ): void {
        $staleDays = (int) \config('localization.retention.stale_days', 180);
        $cutoff    = CarbonImmutable::now()->subDays($staleDays);

        $deleted = $translations->pruneStaleOlderThan($cutoff);

        $log->info('localization stale-translation prune complete', [
            'stale_days' => $staleDays,
            'cutoff'     => $cutoff->toIso8601String(),
            'deleted'    => $deleted,
        ]);
    }

    public function failed(\Throwable $e): void
    {
        // No-op — the queue framework already records the failure.
    }
}
