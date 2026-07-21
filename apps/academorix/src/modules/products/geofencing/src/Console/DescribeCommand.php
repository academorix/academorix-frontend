<?php

declare(strict_types=1);

namespace Academorix\Geofencing\Console;

use Stackra\Console\Commands\BaseCommand;
use Illuminate\Database\Eloquent\Relations\Relation;
use Stackra\Console\Attributes\AsCommand;

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

    public function handle(): int
    {
        $morphMap = Relation::morphMap();
        $this->omni->success('Registered morph aliases:');
        foreach ($morphMap as $alias => $class) {
            $this->omni->render(\sprintf('  %-40s -> %s', $alias, $class));
        }

        if ($morphMap === []) {
            $this->omni->warning('  (none — no #[Geofenceable] or #[GeofenceSubjectAlias] discovered yet)');
        }

        return self::SUCCESS;
    }
}
