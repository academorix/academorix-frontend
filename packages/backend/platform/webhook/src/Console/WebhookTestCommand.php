<?php

declare(strict_types=1);

namespace Academorix\Webhook\Console;

use Academorix\Console\Attributes\AsCommand;
use Academorix\Console\Commands\BaseCommand;
use Academorix\Webhook\Contracts\Data\WebhookSubscriptionInterface;
use Academorix\Webhook\Contracts\Repositories\WebhookSubscriptionRepositoryInterface;
use Academorix\Webhook\Contracts\Services\WebhookSenderInterface;

/**
 * `php artisan webhook:test {subscription}` — fire a test event
 * through a subscription.
 *
 * @category Webhook
 *
 * @since    0.1.0
 */
#[AsCommand(
    name: 'webhook:test',
    description: 'Fire a test event through a webhook subscription.',
)]
final class WebhookTestCommand extends BaseCommand
{
    /**
     * @var string
     */
    protected $signature = 'webhook:test
        {subscription : The subscription id (whs_...) to fire against}
        {--event= : Event name (defaults to the first event on the subscription)}';

    public function handle(
        WebhookSubscriptionRepositoryInterface $subscriptions,
        WebhookSenderInterface $sender,
    ): int {
        $this->omni->titleBar('Test Webhook Subscription', 'sky');

        $id           = (string) $this->argument('subscription');
        $subscription = $subscriptions->find($id);
        if ($subscription === null) {
            $this->omni->error(\sprintf('Subscription "%s" not found.', $id));
            $this->showDuration();

            return self::FAILURE;
        }

        $events = $subscription->{WebhookSubscriptionInterface::ATTR_EVENTS} ?? [];
        $event  = (string) ($this->option('event') ?: (\is_array($events) && $events !== [] ? $events[0] : 'webhook.test'));

        $delivery = $sender->send(
            $subscription,
            $event,
            [
                'test'      => true,
                'timestamp' => \now()->toIso8601String(),
            ],
        );

        $this->omni->success(\sprintf(
            'Queued test delivery "%s" for event "%s".',
            (string) $delivery->getKey(),
            $event,
        ));
        $this->showDuration();

        return self::SUCCESS;
    }
}
