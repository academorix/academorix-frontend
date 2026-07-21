<?php

declare(strict_types=1);

namespace Stackra\Geography\Console;

use Stackra\Console\Attributes\AsCommand;
use Stackra\Console\Commands\BaseCommand;
use Stackra\Geography\Contracts\Repositories\CountryRepositoryInterface;

/**
 * `php artisan geography:reconcile-vendor` — compare our DB against
 * the vendor seeder + report missing rows.
 *
 * `--fix` applies missing rows (never overwrites platform-admin
 * overrides). `--dry-run` reports without writing.
 *
 * Full implementation is deferred until we have a stable
 * comparison surface; this command emits a stub summary today.
 *
 * @category Geography
 *
 * @since    0.1.0
 */
#[AsCommand(
    name: 'geography:reconcile-vendor',
    description: 'Compare our DB against the vendor seeder + report missing rows.',
)]
final class GeographyReconcileVendorCommand extends BaseCommand
{
    /**
     * @var string
     */
    protected $signature = 'geography:reconcile-vendor
        {--dry-run : Report without writing}
        {--fix : Apply missing rows (never overwrites platform overrides)}';

    public function handle(CountryRepositoryInterface $countries): int
    {
        $this->omni->titleBar('Reconcile Vendor Seed', 'amber');

        $dryRun = (bool) $this->option('dry-run');
        $fix    = (bool) $this->option('fix');

        $ourCount = $countries->all()->count();
        $this->omni->info(\sprintf('Local country count: %d.', $ourCount));

        if ($ourCount === 0) {
            $this->omni->warning('The countries table is empty — run `geography:install` first.');
            $this->showDuration();

            return self::SUCCESS;
        }

        if ($dryRun) {
            $this->omni->info('Dry run — no changes applied.');
        } elseif ($fix) {
            $this->omni->info('Reconcile fix path is deferred to a future release.');
        }

        $this->omni->success('Reconcile check complete.');
        $this->showDuration();

        return self::SUCCESS;
    }
}
