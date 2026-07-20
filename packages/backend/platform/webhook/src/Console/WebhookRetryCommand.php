<?php

declare(strict_types=1);

namespace Academorix\Webhook\Console;

use Academorix\Console\Attributes\AsCommand;
use Academorix\Console\Commands\BaseCommand;
use Academorix\Webhook\Contracts\Repositories\WebhookDeliveryRepositoryInterface;
use Academorix\Webhook\Jobs\DispatchWebhookJob;

/**
 * `php artisan webhook:retry {delivery}` — manually retry a specific
 * delivery id.
 *
 * @category Webhook
 *
 * @since    0.1.0
 */
#[AsCommand(
    name: 'webhook:retry',
    description: 'Manually re-dispatch a webhook delivery by id.',
)]
final class WebhookRetryCommand extends BaseCommand
{
    /**
     * @var string
     */
    protected $signature = 'webhook:retry {delivery : The delivery id (whd_...) to re-dispatch}';

    public function handle(WebhookDeliveryRepositoryInterface $deliveries): int
    {
        $this->omni->titleBar('Retry Webhook Delivery', 'sky');

        $id       = (string) $this->argument('delivery');
        $delivery = $deliveries->find($id);

        if ($delivery === null) {
            $this->omni->error(\sprintf('Delivery "%s" not found.', $id));
            $this->showDuration();

            return self::FAILURE;
        }

        DispatchWebhookJob::dispatch($id);

        $this->omni->success(\sprintf('Dispatched retry for delivery "%s".', $id));
        $this->showDuration();

        return self::SUCCESS;
    }
}
