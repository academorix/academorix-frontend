<?php

declare(strict_types=1);

namespace Academorix\Notifications\Sms\Console\Commands;

use Academorix\Console\Commands\BaseCommand;
use Academorix\Notifications\Sms\Jobs\GenerateSmsCostReportJob;
use Symfony\Component\Console\Attribute\AsCommand;

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

    /**
     * @var string
     */
    protected $description = 'Enqueue the monthly SMS cost report.';

    public function handle(): int
    {
        $tenantId = $this->option('tenant');
        if ($tenantId === null) {
            $this->error('--tenant is required.');

            return self::FAILURE;
        }

        $month = (string) $this->option('month');
        if ($month === 'previous') {
            $month = now()->subMonth()->format('Y-m');
        }

        GenerateSmsCostReportJob::dispatch((string) $tenantId, $month);
        $this->info("Cost report job dispatched for tenant={$tenantId} month={$month}.");

        return self::SUCCESS;
    }
}
