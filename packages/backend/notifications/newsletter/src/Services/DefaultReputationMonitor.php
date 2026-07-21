<?php

declare(strict_types=1);

namespace Stackra\Newsletter\Services;

use Stackra\Newsletter\Contracts\Data\NewsletterCampaignInterface;
use Stackra\Newsletter\Contracts\Data\NewsletterInterface;
use Stackra\Newsletter\Contracts\Repositories\NewsletterCampaignRepositoryInterface;
use Stackra\Newsletter\Contracts\Repositories\NewsletterRepositoryInterface;
use Stackra\Newsletter\Contracts\Services\ReputationMonitorInterface;
use Stackra\Newsletter\Enums\NewsletterStatus;
use Stackra\Newsletter\Models\Newsletter;
use Stackra\Newsletter\Models\NewsletterCampaign;
use Illuminate\Container\Attributes\Log;
use Illuminate\Container\Attributes\Singleton;
use Psr\Log\LoggerInterface;

/**
 * Default {@see ReputationMonitorInterface}.
 *
 * @category Newsletter
 *
 * @since    0.1.0
 */
#[Singleton]
final class DefaultReputationMonitor implements ReputationMonitorInterface
{
    public function __construct(
        private readonly NewsletterRepositoryInterface $newsletters,
        private readonly NewsletterCampaignRepositoryInterface $campaigns,
        #[Log('newsletter')] private readonly LoggerInterface $log,
    ) {
    }

    /**
     * {@inheritDoc}
     */
    public function evaluate(NewsletterCampaign $campaign): array
    {
        $newsletter = $this->newsletters->find(
            (string) $campaign->{NewsletterCampaignInterface::ATTR_NEWSLETTER_ID},
        );
        if (! $newsletter instanceof Newsletter) {
            return ['breached' => [], 'streak' => 0, 'throttled' => false];
        }

        $thresholds = $this->resolveThresholds($newsletter);
        $rates      = $this->rates(
            \is_array($campaign->{NewsletterCampaignInterface::ATTR_COUNTERS})
                ? $campaign->{NewsletterCampaignInterface::ATTR_COUNTERS}
                : [],
        );

        $breached = $this->detectBreaches($rates, $thresholds);

        if ($breached === []) {
            // No breach — reset the streak.
            $newsletter->update([
                NewsletterInterface::ATTR_REPUTATION_BREACH_STREAK => 0,
            ]);

            return ['breached' => [], 'streak' => 0, 'throttled' => false];
        }

        $newStreak = (int) $newsletter->{NewsletterInterface::ATTR_REPUTATION_BREACH_STREAK} + 1;
        $limit     = (int) \config('newsletter.reputation.auto_throttle_threshold_breaches', 2);

        $updates = [
            NewsletterInterface::ATTR_REPUTATION_BREACH_STREAK => $newStreak,
        ];

        $throttled = false;
        if ($newStreak >= $limit) {
            $updates[NewsletterInterface::ATTR_STATUS] = NewsletterStatus::Throttled->value;
            $throttled = true;
            $this->log->warning('newsletter: auto-throttled by reputation guardrail', [
                'newsletter_id' => (string) $newsletter->getKey(),
                'streak'        => $newStreak,
                'breached'      => $breached,
            ]);
        }

        $newsletter->update($updates);

        return [
            'breached'  => $breached,
            'streak'    => $newStreak,
            'throttled' => $throttled,
        ];
    }

    /**
     * {@inheritDoc}
     */
    public function reportFor(Newsletter $newsletter, string $month = 'previous'): string
    {
        $since = $month === 'previous'
            ? \now()->subMonth()->startOfMonth()
            : \now()->startOfMonth();

        $campaigns = $this->campaigns->findCompletedInWindow(
            (string) $newsletter->getKey(),
            $since,
        );

        $lines = [
            \sprintf('Reputation report — %s (%s)', $newsletter->{NewsletterInterface::ATTR_NAME}, $month),
            \sprintf('Window since: %s', $since->toIso8601String()),
            \sprintf('Campaigns evaluated: %d', $campaigns->count()),
        ];

        foreach ($campaigns as $campaign) {
            $rates = $this->rates(
                \is_array($campaign->{NewsletterCampaignInterface::ATTR_COUNTERS})
                    ? $campaign->{NewsletterCampaignInterface::ATTR_COUNTERS}
                    : [],
            );
            $lines[] = \sprintf(
                '  - %s : open=%.2f%% click=%.2f%% bounce=%.2f%% complaint=%.3f%%',
                (string) $campaign->getKey(),
                $rates['open'] * 100,
                $rates['click'] * 100,
                $rates['bounce'] * 100,
                $rates['complaint'] * 100,
            );
        }

        return \implode("\n", $lines);
    }

    /**
     * @return array{
     *     min_open_rate: float,
     *     min_click_rate: float,
     *     max_bounce_rate: float,
     *     max_complaint_rate: float,
     * }
     */
    private function resolveThresholds(Newsletter $newsletter): array
    {
        /** @var array<string, mixed> $defaults */
        $defaults = (array) \config('newsletter.reputation.default_thresholds', []);
        /** @var array<string, mixed> $overrides */
        $overrides = \is_array($newsletter->{NewsletterInterface::ATTR_REPUTATION_THRESHOLDS})
            ? $newsletter->{NewsletterInterface::ATTR_REPUTATION_THRESHOLDS}
            : [];

        $merged = \array_replace($defaults, $overrides);

        return [
            'min_open_rate'      => (float) ($merged['min_open_rate'] ?? 0.10),
            'min_click_rate'     => (float) ($merged['min_click_rate'] ?? 0.01),
            'max_bounce_rate'    => (float) ($merged['max_bounce_rate'] ?? 0.05),
            'max_complaint_rate' => (float) ($merged['max_complaint_rate'] ?? 0.003),
        ];
    }

    /**
     * @param  array<string, mixed>  $counters
     * @return array{
     *     open: float,
     *     click: float,
     *     bounce: float,
     *     complaint: float,
     * }
     */
    private function rates(array $counters): array
    {
        $sent = (int) ($counters['sent'] ?? 0);
        if ($sent <= 0) {
            return ['open' => 0.0, 'click' => 0.0, 'bounce' => 0.0, 'complaint' => 0.0];
        }

        return [
            'open'      => ((int) ($counters['opened'] ?? 0)) / $sent,
            'click'     => ((int) ($counters['clicked'] ?? 0)) / $sent,
            'bounce'    => ((int) ($counters['bounced'] ?? 0)) / $sent,
            'complaint' => ((int) ($counters['complained'] ?? 0)) / $sent,
        ];
    }

    /**
     * @param  array{open: float, click: float, bounce: float, complaint: float}  $rates
     * @param  array{min_open_rate: float, min_click_rate: float, max_bounce_rate: float, max_complaint_rate: float}  $thresholds
     * @return list<string>
     */
    private function detectBreaches(array $rates, array $thresholds): array
    {
        $breached = [];
        if ($rates['open'] < $thresholds['min_open_rate']) {
            $breached[] = 'min_open_rate';
        }
        if ($rates['click'] < $thresholds['min_click_rate']) {
            $breached[] = 'min_click_rate';
        }
        if ($rates['bounce'] > $thresholds['max_bounce_rate']) {
            $breached[] = 'max_bounce_rate';
        }
        if ($rates['complaint'] > $thresholds['max_complaint_rate']) {
            $breached[] = 'max_complaint_rate';
        }

        return $breached;
    }
}
