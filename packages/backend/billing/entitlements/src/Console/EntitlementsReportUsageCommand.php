<?php

declare(strict_types=1);

namespace Stackra\Entitlements\Console;

use Stackra\Console\Attributes\AsCommand;
use Stackra\Console\Commands\BaseCommand;
use Stackra\Entitlements\Jobs\ExportUsageForBillingJob;

/**
 * `php artisan entitlements:report-usage {--month=}` — dispatch
 * `ExportUsageForBillingJob` for one month.
 *
 * When `--month` is omitted the command exports the previous
 * calendar month (typical cron-driven end-of-period run).
 *
 * @category Entitlements
 *
 * @since    0.1.0
 */
#[AsCommand(
    name: 'entitlements:report-usage',
    description: 'Export pool-kind usage to billing for one month.',
)]
final class EntitlementsReportUsageCommand extends BaseCommand
{
    protected $signature = 'entitlements:report-usage
        {--month= : Period key (YYYY-MM). Defaults to previous month.}';

    public function handle(): int
    {
        $this->omni->titleBar('Entitlements — Report Usage', 'sky');

        $month = $this->option('month');
        if (! \is_string($month) || $month === '') {
            $month = \now()->subMonth()->format('Y-m');
        }

        if (\preg_match('/^\d{4}-\d{2}$/', $month) !== 1) {
            $this->omni->error(\sprintf('Invalid month format "%s" — expected YYYY-MM.', $month));

            return self::FAILURE;
        }

        ExportUsageForBillingJob::dispatch($month);
        $this->omni->success(\sprintf('Export dispatched for %s.', $month));
        $this->showDuration();

        return self::SUCCESS;
    }
}
