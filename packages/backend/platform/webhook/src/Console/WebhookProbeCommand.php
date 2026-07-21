<?php

declare(strict_types=1);

namespace Stackra\Webhook\Console;

use Stackra\Console\Attributes\AsCommand;
use Stackra\Console\Commands\BaseCommand;
use Stackra\Webhook\Contracts\Repositories\WebhookSubscriptionRepositoryInterface;
use Stackra\Webhook\Jobs\WebhookProbeJob;

/**
 * `php artisan webhook:probe {subscription}` — dispatch a health
 * probe against a subscription's `health_probe_url`.
 *
 * @category Webhook
 *
 * @since    0.1.0
 */
#[AsCommand(
    name: 'webhook:probe',
    description: 'Dispatch a health probe against a webhook subscription.',
)]
final class WebhookProbeCommand extends BaseCommand
{
    /**
     * @var string
     */
    protected $signature = 'webhook:probe {subscription : The subscription id (whs_...) to probe}';

    public function handle(WebhookSubscriptionRepositoryInterface $subscriptions): int
    {
        $this->omni->titleBar('Probe Webhook Subscription', 'sky');

        $id           = (string) $this->argument('subscription');
        $subscription = $subscriptions->find($id);

        if ($subscription === null) {
            $this->omni->error(\sprintf('Subscription "%s" not found.', $id));
            $this->showDuration();

            return self::FAILURE;
        }

        WebhookProbeJob::dispatch($id);

        $this->omni->success(\sprintf('Dispatched health probe for "%s".', $id));
        $this->showDuration();

        return self::SUCCESS;
    }
}
