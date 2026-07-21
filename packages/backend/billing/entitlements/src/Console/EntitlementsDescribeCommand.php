<?php

declare(strict_types=1);

namespace Stackra\Entitlements\Console;

use Stackra\Console\Attributes\AsCommand;
use Stackra\Console\Commands\BaseCommand;
use Stackra\Entitlements\Contracts\Services\EntitlementRegistryInterface;

/**
 * `php artisan entitlements:describe` — describe every registered
 * entitlement key + cross-reference against the module's reserved
 * keys list.
 *
 * @category Entitlements
 *
 * @since    0.1.0
 */
#[AsCommand(
    name: 'entitlements:describe',
    description: 'Describe every registered entitlement key.',
)]
final class EntitlementsDescribeCommand extends BaseCommand
{
    public function handle(EntitlementRegistryInterface $registry): int
    {
        $this->omni->titleBar('Entitlements — Registry', 'sky');

        /** @var list<string> $reserved */
        $reserved   = (array) \config('entitlements.reserved_keys', []);
        $registered = $registry->keys();

        $this->omni->tableHeader('Key', 'Kind', 'Period', 'Reserved?');
        foreach ($registered as $key) {
            $shape = $registry->defaultsFor($key);
            if ($shape === null) {
                continue;
            }

            $this->omni->tableRow(
                $key,
                $shape['kind']->value,
                $shape['period']?->value ?? '—',
                \in_array($key, $reserved, true) ? 'yes' : 'no',
            );
        }

        $this->omni->success(\sprintf(
            '%d registered key(s); %d reserved key(s).',
            \count($registered),
            \count($reserved),
        ));
        $this->showDuration();

        return self::SUCCESS;
    }
}
