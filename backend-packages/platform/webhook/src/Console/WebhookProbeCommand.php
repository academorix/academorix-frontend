<?php

declare(strict_types=1);

namespace Academorix\Webhook\Console;

use Academorix\Console\Attributes\AsCommand;
use Academorix\Console\Console\Commands\BaseCommand;
use Academorix\Webhook\Contracts\Repositories\WebhookSubscriptionRepositoryInterface;
use Academorix\Webhook\Jobs\WebhookProbeJob;

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
