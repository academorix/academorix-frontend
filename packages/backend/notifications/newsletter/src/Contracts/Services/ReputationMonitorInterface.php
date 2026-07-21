<?php

declare(strict_types=1);

namespace Stackra\Newsletter\Contracts\Services;

use Stackra\Newsletter\Models\Newsletter;
use Stackra\Newsletter\Models\NewsletterCampaign;
use Stackra\Newsletter\Services\DefaultReputationMonitor;
use Illuminate\Container\Attributes\Bind;

/**
 * Evaluate a completed campaign against the newsletter's reputation
 * thresholds and, on breach, increment the breach streak counter +
 * auto-throttle the publication when the streak crosses the
 * configured threshold.
 *
 * ## Thresholds
 *
 * Every newsletter carries an override map in
 * `reputation_thresholds`; missing keys fall back to the platform
 * defaults from `newsletter.reputation.default_thresholds`. Metrics
 * evaluated:
 *
 *  * `min_open_rate`      — opened / sent must be ≥ threshold.
 *  * `min_click_rate`     — clicked / sent must be ≥ threshold.
 *  * `max_bounce_rate`    — bounced / sent must be ≤ threshold.
 *  * `max_complaint_rate` — complained / sent must be ≤ threshold.
 *
 * @category Newsletter
 *
 * @since    0.1.0
 */
#[Bind(DefaultReputationMonitor::class)]
interface ReputationMonitorInterface
{
    /**
     * Evaluate the campaign's counters and update the parent
     * newsletter's breach streak. Auto-throttles when the streak
     * crosses `newsletter.reputation.auto_throttle_threshold_breaches`.
     *
     * @return array{
     *     breached: list<string>,
     *     streak: int,
     *     throttled: bool,
     * }
     */
    public function evaluate(NewsletterCampaign $campaign): array;

    /**
     * Produce a plain-text reputation report for a newsletter.
     */
    public function reportFor(Newsletter $newsletter, string $month = 'previous'): string;
}
