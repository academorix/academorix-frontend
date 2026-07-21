<?php

declare(strict_types=1);

namespace Academorix\Geofencing\Console\Commands;

use Stackra\Console\Commands\BaseCommand;
use Illuminate\Database\Eloquent\Relations\Relation;
use Symfony\Component\Console\Attribute\AsCommand;

/**
 * `geofencing:list-subject-aliases` — print every registered
 * `#[GeofenceSubjectAlias]` alias with its target class.
 *
 * Because both attributes register into the same morph map, this command
 * currently mirrors `list-fenceable-aliases`. The compile-time discovery
 * pipeline will split them into two separate maps in a follow-up.
 *
 * @category Geofencing
 *
 * @since    0.1.0
 */
#[AsCommand(
    name: 'geofencing:list-subject-aliases',
    description: 'Print every registered #[GeofenceSubjectAlias] alias.',
)]
final class ListSubjectAliasesCommand extends BaseCommand
{
    /**
     * @var string
     */
    protected $signature = 'geofencing:list-subject-aliases';

    /**
     * @var string
     */
    protected $description = 'Print every registered #[GeofenceSubjectAlias] alias.';

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
