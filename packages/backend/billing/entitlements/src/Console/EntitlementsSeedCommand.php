<?php

declare(strict_types=1);

namespace Stackra\Entitlements\Console;

use Stackra\Console\Attributes\AsCommand;
use Stackra\Console\Commands\BaseCommand;
use Stackra\Entitlements\Contracts\Registry\EntitlementRegistryInterface;

/**
 * `php artisan entitlements:seed` — dev helper.
 *
 * Prints every discovered `#[ConsumesEntitlement]` key alongside its
 * default shape, useful for verifying the registry populated correctly
 * after a fresh `composer dump-autoload`.
 *
 * @category Entitlements
 *
 * @since    0.1.0
 */
#[AsCommand(
    name: 'entitlements:seed',
    description: 'Print every discovered entitlement key + default shape.',
)]
final class EntitlementsSeedCommand extends BaseCommand
{
    public function handle(EntitlementRegistryInterface $registry): int
    {
        $this->omni->titleBar('Entitlements — Registered Keys', 'sky');

        $keys = $registry->keys();
        if ($keys === []) {
            $this->omni->info('No entitlement keys discovered — nothing to seed.');
            $this->showDuration();

            return self::SUCCESS;
        }

        $this->omni->tableHeader('Key', 'Kind', 'Period', 'Default value');
        foreach ($keys as $key) {
            $shape = $registry->defaultsFor($key);
            if ($shape === null) {
                continue;
            }

            $this->omni->tableRow(
                $key,
                $shape['kind']->value,
                $shape['period']?->value ?? '—',
                (string) \json_encode($shape['value'], \JSON_UNESCAPED_SLASHES),
            );
        }

        $this->omni->success(\sprintf('%d key(s) registered.', \count($keys)));
        $this->showDuration();

        return self::SUCCESS;
    }
}
