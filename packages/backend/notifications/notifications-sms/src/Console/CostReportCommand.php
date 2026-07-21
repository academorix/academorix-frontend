<?php

declare(strict_types=1);

namespace Stackra\Notifications\Sms\Console;

use Stackra\Console\Commands\BaseCommand;
use Stackra\Notifications\Sms\Jobs\GenerateSmsCostReportJob;
use Stackra\Console\Attributes\AsCommand;

/**
 * `notifications:sms:cost-report` — enqueue the monthly SMS cost report.
 *
 * @category NotificationsSms
 *
 * @since    0.1.0
 */
#[AsCommand(
    name: 'notifications:sms:cost-report',
    description: 'Enqueue the monthly SMS cost report.',
)]
final class CostReportCommand extends BaseCommand
{
    /**
     * @var string
     */
    protected $signature = 'notifications:sms:cost-report {--tenant=} {--month=previous}';

    public function handle(): int
    {
        $tenantId = $this->option('tenant');
        if ($tenantId === null) {
            $this->omni->error('--tenant is required.');

            return self::FAILURE;
        }

        $month = (string) $this->option('month');
        if ($month === 'previous') {
            $month = now()->subMonth()->format('Y-m');
        }

        GenerateSmsCostReportJob::dispatch((string) $tenantId, $month);
        $this->omni->success("Cost report job dispatched for tenant={$tenantId} month={$month}.");

        return self::SUCCESS;
    }
}
