<?php

declare(strict_types=1);

namespace Academorix\Webhook\Console;

use Academorix\Console\Attributes\AsCommand;
use Academorix\Console\Commands\BaseCommand;
use Academorix\Webhook\Contracts\Data\WebhookSubscriptionInterface;
use Academorix\Webhook\Contracts\Repositories\WebhookSubscriptionRepositoryInterface;

/**
 * `php artisan webhook:list` — print every webhook subscription in
 * the current DB. Useful for platform-admin diagnostics.
 *
 * @category Webhook
 *
 * @since    0.1.0
 */
#[AsCommand(
    name: 'webhook:list',
    description: 'List every webhook subscription in the current database.',
)]
final class WebhookListCommand extends BaseCommand
{
    public function handle(WebhookSubscriptionRepositoryInterface $subscriptions): int
    {
        $this->omni->titleBar('Webhook Subscriptions', 'sky');

        $rows = $subscriptions->paginate(1000)->getCollection();
        if ($rows->isEmpty()) {
            $this->omni->info('No webhook subscriptions found.');
            $this->showDuration();

            return self::SUCCESS;
        }

        $this->omni->tableHeader('ID', 'Tenant', 'Destination', 'Status', 'Events');
        foreach ($rows as $row) {
            $events = $row->{WebhookSubscriptionInterface::ATTR_EVENTS} ?? [];
            $this->omni->tableRow(
                (string) $row->getKey(),
                (string) $row->{WebhookSubscriptionInterface::ATTR_TENANT_ID},
                (string) $row->{WebhookSubscriptionInterface::ATTR_DESTINATION},
                (string) $row->{WebhookSubscriptionInterface::ATTR_STATUS},
                \is_array($events) ? \implode(', ', $events) : (string) $events,
            );
        }

        $this->omni->success(\sprintf('%d subscription(s).', $rows->count()));
        $this->showDuration();

        return self::SUCCESS;
    }
}
