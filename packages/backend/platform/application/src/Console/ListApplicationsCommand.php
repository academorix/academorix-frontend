<?php

declare(strict_types=1);

namespace Academorix\Application\Console;

use Academorix\Application\Contracts\Data\ApplicationInterface;
use Academorix\Application\Contracts\Repositories\ApplicationRepositoryInterface;
use Academorix\Console\Attributes\AsCommand;
use Academorix\Console\Commands\BaseCommand;

/**
 * `php artisan application:list` — dump every Application row as a
 * table on stdout. Handy for onboarding + ops diagnostics.
 *
 * Extends {@see BaseCommand} (per `.kiro/steering/console-commands.md`)
 * for the OmniTerm output surface. Deps arrive via method injection on
 * `handle()` — never the constructor — so `php artisan list` doesn't
 * pay the repository's boot cost.
 *
 * @category Application
 *
 * @since    0.1.0
 */
#[AsCommand(
    name: 'application:list',
    description: 'List every Application row. Ops + onboarding diagnostic.',
)]
final class ListApplicationsCommand extends BaseCommand
{
    /**
     * The signature — needed for the argument/option DSL. Command
     * `name` + `description` live on `#[AsCommand]` and are the
     * source of truth; the name here must match verbatim.
     */
    protected $signature = 'application:list {--with-trashed : Include soft-deleted rows}';

    /**
     * List every Application row.
     *
     * @param  ApplicationRepositoryInterface  $applications  Persistence boundary.
     * @return int  Exit status.
     */
    public function handle(ApplicationRepositoryInterface $applications): int
    {
        $this->omni->titleBar('Applications', 'sky');

        $query = $this->option('with-trashed') === true
            ? $applications->query()->withTrashed()
            : $applications->query();

        $rows = $query->orderBy(ApplicationInterface::ATTR_CREATED_AT)->get();

        if ($rows->isEmpty()) {
            $this->omni->warning('No Applications found. Run `php artisan db:seed` first.');
            $this->showDuration();

            return self::SUCCESS;
        }

        $this->omni->tableHeader('Slug', 'Name', 'Central Host', 'Default?', 'System?', 'Deleted?');

        foreach ($rows as $a) {
            $slug          = (string) $a->{ApplicationInterface::ATTR_SLUG};
            $name          = (string) $a->{ApplicationInterface::ATTR_NAME};
            $centralHost   = (string) $a->{ApplicationInterface::ATTR_CENTRAL_HOST};
            $isDefault     = $a->{ApplicationInterface::ATTR_IS_DEFAULT} === true ? 'yes' : '';
            $isSystem      = $a->{ApplicationInterface::ATTR_IS_SYSTEM} === true ? 'yes' : '';
            $deletedMarker = $a->{ApplicationInterface::ATTR_DELETED_AT} !== null;

            // Deleted rows render RED so ops can spot archived Applications
            // in the same table without filtering.
            if ($deletedMarker) {
                $this->omni->tableRowError($slug, $name, $centralHost, $isDefault, $isSystem, 'yes');
            } else {
                $this->omni->tableRow($slug, $name, $centralHost, $isDefault, $isSystem, '');
            }
        }

        $this->omni->success(\sprintf('Listed %d Application(s).', $rows->count()));
        $this->showDuration();

        return self::SUCCESS;
    }
}
