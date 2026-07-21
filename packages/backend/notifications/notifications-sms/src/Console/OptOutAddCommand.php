<?php

declare(strict_types=1);

namespace Stackra\Notifications\Sms\Console;

use Stackra\Console\Commands\BaseCommand;
use Stackra\Notifications\Sms\Enums\SmsOptOutReason;
use Stackra\Notifications\Sms\Jobs\RecordSmsOptOutJob;
use Stackra\Console\Attributes\AsCommand;

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

        $this->omni->success("Opt-out job dispatched for {$phone}.");

        return self::SUCCESS;
    }
}
