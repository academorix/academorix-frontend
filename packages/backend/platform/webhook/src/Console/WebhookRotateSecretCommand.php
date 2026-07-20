<?php

declare(strict_types=1);

namespace Academorix\Webhook\Console;

use Academorix\Console\Attributes\AsCommand;
use Academorix\Console\Commands\BaseCommand;
use Academorix\Webhook\Contracts\Repositories\WebhookSubscriptionRepositoryInterface;
use Academorix\Webhook\Contracts\Services\SecretRotatorInterface;

/**
 * `php artisan webhook:rotate-secret {subscription}` — trigger a
 * signing-secret rotation on a subscription id.
 *
 * @category Webhook
 *
 * @since    0.1.0
 */
#[AsCommand(
    name: 'webhook:rotate-secret',
    description: 'Rotate the signing secret for a webhook subscription.',
)]
final class WebhookRotateSecretCommand extends BaseCommand
{
    /**
     * @var string
     */
    protected $signature = 'webhook:rotate-secret {subscription : The subscription id (whs_...) to rotate}';

    public function handle(
        WebhookSubscriptionRepositoryInterface $subscriptions,
        SecretRotatorInterface $rotator,
    ): int {
        $this->omni->titleBar('Rotate Webhook Secret', 'sky');

        $id           = (string) $this->argument('subscription');
        $subscription = $subscriptions->find($id);

        if ($subscription === null) {
            $this->omni->error(\sprintf('Subscription "%s" not found.', $id));
            $this->showDuration();

            return self::FAILURE;
        }

        $rotator->rotate($subscription);

        $this->omni->success(\sprintf(
            'Rotated signing secret for "%s". Rotation grace runs for %d seconds.',
            $id,
            (int) \config('webhook.signing.rotation_grace_seconds', 86400),
        ));
        $this->showDuration();

        return self::SUCCESS;
    }
}
