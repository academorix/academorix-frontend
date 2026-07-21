<?php

declare(strict_types=1);

namespace Academorix\Geofencing\Console;

use Stackra\Console\Commands\BaseCommand;
use Illuminate\Database\Eloquent\Relations\Relation;
use Stackra\Console\Attributes\AsCommand;

/**
 * `geofencing:list-fenceable-aliases` — print every registered
 * `#[Geofenceable]` alias with its target class. Debug surface.
 *
 * @category Geofencing
 *
 * @since    0.1.0
 */
#[AsCommand(
    name: 'geofencing:list-fenceable-aliases',
    description: 'Print every registered #[Geofenceable] alias.',
)]
final class ListFenceableAliasesCommand extends BaseCommand
{
    /**
     * @var string
     */
    protected $signature = 'geofencing:list-fenceable-aliases';

    public function handle(): int
    {
        $morphMap = Relation::morphMap();
        if ($morphMap === []) {
            $this->omni->warning('No morph aliases registered yet.');

            return self::SUCCESS;
        }

        foreach ($morphMap as $alias => $class) {
            $this->omni->render(\sprintf('%-40s -> %s', $alias, $class));
        }

        return self::SUCCESS;
    }
}
