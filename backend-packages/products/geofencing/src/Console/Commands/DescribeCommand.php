<?php

declare(strict_types=1);

namespace Academorix\Geofencing\Console\Commands;

use Academorix\Console\Commands\BaseCommand;
use Illuminate\Database\Eloquent\Relations\Relation;
use Symfony\Component\Console\Attribute\AsCommand;

/**
 * `geofencing:describe` — print module state for a tenant.
 *
 * @category Geofencing
 *
 * @since    0.1.0
 */
#[AsCommand(
    name: 'geofencing:describe',
    description: 'Print the module\'s registered aliases + recent evaluation counts.',
)]
final class DescribeCommand extends BaseCommand
{
    /**
     * @var string
     */
    protected $signature = 'geofencing:describe {--tenant=}';

    /**
     * @var string
     */
    protected $description = 'Print the module\'s registered aliases + recent evaluation counts.';

    public function handle(): int
    {
        $morphMap = Relation::morphMap();
        $this->info('Registered morph aliases:');
        foreach ($morphMap as $alias => $class) {
            $this->line(\sprintf('  %-40s -> %s', $alias, $class));
        }

        if ($morphMap === []) {
            $this->warn('  (none — no #[Geofenceable] or #[GeofenceSubjectAlias] discovered yet)');
        }

        return self::SUCCESS;
    }
}
