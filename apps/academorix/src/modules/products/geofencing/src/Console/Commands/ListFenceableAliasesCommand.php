<?php

declare(strict_types=1);

namespace Stackra\Geofencing\Console\Commands;

use Stackra\Console\Commands\BaseCommand;
use Illuminate\Database\Eloquent\Relations\Relation;
use Symfony\Component\Console\Attribute\AsCommand;

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

    /**
     * @var string
     */
    protected $description = 'Print every registered #[Geofenceable] alias.';

    public function handle(): int
    {
        $morphMap = Relation::morphMap();
        if ($morphMap === []) {
            $this->warn('No morph aliases registered yet.');

            return self::SUCCESS;
        }

        foreach ($morphMap as $alias => $class) {
            $this->line(\sprintf('%-40s -> %s', $alias, $class));
        }

        return self::SUCCESS;
    }
}
