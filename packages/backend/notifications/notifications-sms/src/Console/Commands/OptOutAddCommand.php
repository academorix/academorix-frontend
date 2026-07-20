<?php

declare(strict_types=1);

namespace Academorix\Notifications\Sms\Console\Commands;

use Academorix\Console\Commands\BaseCommand;
use Academorix\Notifications\Sms\Enums\SmsOptOutReason;
use Academorix\Notifications\Sms\Jobs\RecordSmsOptOutJob;
use Symfony\Component\Console\Attribute\AsCommand;

/**
 * `notifications:sms:opt-out-add` — add a phone to the SMS opt-out list.
 *
 * @category NotificationsSms
 *
 * @since    0.1.0
 */
#[AsCommand(
    name: 'notifications:sms:opt-out-add',
    description: 'Add a phone to the SMS opt-out list.',
)]
final class OptOutAddCommand extends BaseCommand
{
    /**
     * @var string
     */
    protected $signature = 'notifications:sms:opt-out-add {phone} {--tenant=} {--reason=admin} {--provider=twilio}';

    /**
     * @var string
     */
    protected $description = 'Add a phone to the SMS opt-out list.';

    public function handle(): int
    {
        $phone    = (string) $this->argument('phone');
        $tenantId = $this->option('tenant');
        $reason   = SmsOptOutReason::tryFrom((string) $this->option('reason')) ?? SmsOptOutReason::Admin;
        $provider = (string) $this->option('provider');

        RecordSmsOptOutJob::dispatch(
            tenantId: $tenantId === null ? null : (string) $tenantId,
            phone: $phone,
            reason: $reason,
            provider: $provider,
        );

        $this->info("Opt-out job dispatched for {$phone}.");

        return self::SUCCESS;
    }
}
