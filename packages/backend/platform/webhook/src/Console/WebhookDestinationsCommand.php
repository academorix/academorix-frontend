<?php

declare(strict_types=1);

namespace Academorix\Webhook\Console;

use Academorix\Console\Attributes\AsCommand;
use Academorix\Console\Commands\BaseCommand;
use Academorix\Webhook\Contracts\Services\WebhookDestinationRegistryInterface;

/**
 * `php artisan webhook:destinations` — list every registered
 * destination driver + its required config keys.
 *
 * @category Webhook
 *
 * @since    0.1.0
 */
#[AsCommand(
    name: 'webhook:destinations',
    description: 'List every registered webhook destination driver.',
)]
final class WebhookDestinationsCommand extends BaseCommand
{
    public function handle(WebhookDestinationRegistryInterface $registry): int
    {
        $this->omni->titleBar('Webhook Destinations', 'sky');

        $drivers = $registry->all();
        if ($drivers === []) {
            $this->omni->warning('No destination drivers registered.');
            $this->showDuration();

            return self::SUCCESS;
        }

        $this->omni->tableHeader('Name', 'Batching', 'Required Config', 'Class');
        foreach ($drivers as $name => $definition) {
            $this->omni->tableRow(
                (string) $name,
                $definition['supports_batching'] ? 'yes' : 'no',
                \implode(', ', $definition['required_config']),
                (string) $definition['class'],
            );
        }

        $this->omni->success(\sprintf('%d destination driver(s) registered.', \count($drivers)));
        $this->showDuration();

        return self::SUCCESS;
    }
}
