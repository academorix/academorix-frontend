<?php

declare(strict_types=1);

namespace Stackra\Subscription\Contracts\Services;

use Stackra\Subscription\Models\Subscription;
use Stackra\Subscription\Services\DefaultDunningOrchestrator;
use Illuminate\Container\Attributes\Bind;

/**
 * Grace-period progression orchestrator.
 *
 * Advances subscriptions through the four dunning stages named in
 * `config('subscription.dunning.stages')` — `at_risk` → `grace` →
 * `suspended` → `cancelled`. Called by `AdvanceDunningStageJob` on
 * every scan; safe to call multiple times per subscription per day
 * (idempotent — a subscription that already reached the terminal
 * stage is a no-op).
 *
 * @category Subscription
 *
 * @since    0.1.0
 */
#[Bind(DefaultDunningOrchestrator::class)]
interface DunningOrchestratorInterface
{
    /**
     * Advance one subscription to the next stage when its
     * `grace_ends_at` has passed. Returns the mutated subscription
     * (or the same instance when no transition applied).
     *
     * @param  Subscription  $subscription  Subscription to progress.
     */
    public function advance(Subscription $subscription): Subscription;

    /**
     * Convenience — return the next stage a subscription would
     * transition to (or null when already terminal). Used by the
     * command's `--dry-run` output.
     */
    public function nextStage(Subscription $subscription): ?string;
}
