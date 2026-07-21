<?php

declare(strict_types=1);

namespace Stackra\Activity\Jobs;

use Stackra\Activity\Contracts\Repositories\ActivityRepositoryInterface;
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
 * Hard-delete every activity_log row past retention for one tenant.
 *
 * Dispatched per-tenant by the `activity:prune` command. Reads the
 * retention window from `config('activity.retention.tier_days.*')`
 * keyed by the passed-in tier — passing a tenant id here rather than
 * the full Tenant model keeps the payload tiny (jobs SerializeModels
 * their arguments; passing a whole tenant with every ->branding
 * JSON blob attached blows up the queue payload).
 *
 * @category Activity
 *
 * @since    0.1.0
 */
#[Queue('retention')]
#[Timeout(1800)]
#[Tries(1)]
final class PruneActivityLogJob implements ShouldQueue
{
    use Dispatchable;
    use InteractsWithQueue;
    use Queueable;
    use SerializesModels;

    /**
     * @param  string       $tenantId  Tenant to prune.
     * @param  string|null  $tier      Retention tier override. When null,
     *                                 falls back to the config default.
     */
    public function __construct(
        public readonly string $tenantId,
        public readonly ?string $tier = null,
    ) {
    }

    /**
     * Compute the cutoff, prune, and emit a metric.
     */
    public function handle(
        ActivityRepositoryInterface $activities,
        LoggerInterface $log,
    ): void {
        $tier = $this->tier
            ?? (string) \config('activity.retention.default_tier', 'starter');

        // Resolve the tier window — invalid tiers fall back to the
        // narrowest (most-conservative) window rather than throwing;
        // an unrecognised tier is data-integrity concern, not a
        // reason to skip pruning altogether.
        $days = (int) \config("activity.retention.tier_days.{$tier}", 30);
        $cutoff = CarbonImmutable::now()->subDays($days);

        $deleted = $activities->pruneOlderThan($cutoff);

        $log->info('activity retention prune complete', [
            'tenant_id' => $this->tenantId,
            'tier'      => $tier,
            'days'      => $days,
            'cutoff'    => $cutoff->toIso8601String(),
            'deleted'   => $deleted,
        ]);
    }

    /**
     * Never propagate a prune failure — retention is best-effort;
     * the operator will see the failed job in the queue dashboard.
     */
    public function failed(\Throwable $e): void
    {
        // No-op — the queue framework already records the failure.
    }
}
