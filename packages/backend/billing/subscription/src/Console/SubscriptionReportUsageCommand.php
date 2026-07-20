<?php

declare(strict_types=1);

namespace Academorix\Subscription\Console;

use Academorix\Console\Attributes\AsCommand;
use Academorix\Console\Commands\BaseCommand;
use Academorix\Subscription\Contracts\Repositories\SubscriptionRepositoryInterface;
use Academorix\Subscription\Jobs\ReportMeteredUsageJob;

/**
 * `php artisan subscription:report-usage {subscription}` — push
 * metered usage to Stripe / Paddle for one subscription.
 *
 * @category Subscription
 *
 * @since    0.1.0
 */
#[AsCommand(
    name: 'subscription:report-usage',
    description: 'Manually report metered usage for one subscription.',
)]
final class SubscriptionReportUsageCommand extends BaseCommand
{
    /**
     * @var string
     */
    protected $signature = 'subscription:report-usage
        {subscription : Subscription id to report on}
        {--meter= : Meter key}
        {--amount=1 : Delta to report}
        {--price= : Provider price id}';

    public function handle(SubscriptionRepositoryInterface $subscriptions): int
    {
        $this->omni->titleBar('Subscription — Report Usage', 'sky');

        $subscriptionId = (string) $this->argument('subscription');
        $meterKey       = (string) ($this->option('meter') ?? '');
        $priceId        = (string) ($this->option('price') ?? '');
        $amountRaw      = $this->option('amount');
        $amount         = \is_numeric($amountRaw) ? (int) $amountRaw : 1;

        if ($meterKey === '' || $priceId === '') {
            $this->omni->error('Both --meter and --price options are required.');
            $this->showDuration();

            return self::FAILURE;
        }

        $subscription = $subscriptions->find($subscriptionId);
        if ($subscription === null) {
            $this->omni->error(\sprintf('Subscription "%s" not found.', $subscriptionId));
            $this->showDuration();

            return self::FAILURE;
        }

        ReportMeteredUsageJob::dispatch(
            $subscriptionId,
            $priceId,
            $meterKey,
            $amount,
        );

        $this->omni->success(\sprintf(
            'ReportMeteredUsageJob dispatched for subscription %s (meter=%s, amount=%d).',
            $subscriptionId,
            $meterKey,
            $amount,
        ));

        $this->showDuration();

        return self::SUCCESS;
    }
}
