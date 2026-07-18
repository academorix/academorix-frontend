<?php

declare(strict_types=1);

namespace Academorix\Notifications\Sms\Console\Commands;

use Academorix\Console\Commands\BaseCommand;
use Academorix\Notifications\Sms\Contracts\Data\SmsOptOutInterface;
use Academorix\Notifications\Sms\Contracts\Repositories\SmsOptOutRepositoryInterface;
use Academorix\Notifications\Sms\Enums\SmsOptOutReason;
use Symfony\Component\Console\Attribute\AsCommand;

/**
 * `notifications:sms:opt-out-remove` — revoke an SMS opt-out.
 *
 * Refuses STOP-keyword rows unless `--force` is passed. `--force` implies
 * super_admin + re-consent evidence — the caller vouches for the compliance
 * proof.
 *
 * @category NotificationsSms
 *
 * @since    0.1.0
 */
#[AsCommand(
    name: 'notifications:sms:opt-out-remove',
    description: 'Revoke an SMS opt-out.',
)]
final class OptOutRemoveCommand extends BaseCommand
{
    /**
     * @var string
     */
    protected $signature = 'notifications:sms:opt-out-remove {phone} {--tenant=} {--force}';

    /**
     * @var string
     */
    protected $description = 'Revoke an SMS opt-out.';

    public function handle(SmsOptOutRepositoryInterface $optOuts): int
    {
        $phone    = (string) $this->argument('phone');
        $tenantId = $this->option('tenant');
        $force    = (bool) $this->option('force');

        $optOut = $optOuts->findActiveForPhone(
            $phone,
            $tenantId === null ? null : (string) $tenantId,
        );

        if ($optOut === null) {
            $this->info("No active opt-out found for {$phone}.");

            return self::SUCCESS;
        }

        // stop_keyword rows require --force + re-consent evidence flag.
        $reason = $optOut->{SmsOptOutInterface::ATTR_REASON};
        $reasonValue = $reason instanceof SmsOptOutReason
            ? $reason
            : SmsOptOutReason::tryFrom((string) $reason);
        if ($reasonValue === SmsOptOutReason::StopKeyword && ! $force) {
            $this->error('Refusing to revoke a stop_keyword opt-out without --force + re-consent evidence.');

            return self::FAILURE;
        }

        if ($force) {
            $metadata = (array) $optOut->getAttribute(SmsOptOutInterface::ATTR_METADATA);
            $metadata['re_consent_evidence']  = true;
            $metadata['super_admin_override'] = true;
            $metadata['re_consent_source']    = 'artisan_force';
            $optOut->setAttribute(SmsOptOutInterface::ATTR_METADATA, $metadata);
            $optOut->save();
        }

        $optOut->delete();
        $this->info("Opt-out revoked for {$phone}.");

        return self::SUCCESS;
    }
}
