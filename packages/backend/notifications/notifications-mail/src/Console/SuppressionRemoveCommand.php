<?php

declare(strict_types=1);

namespace Academorix\Notifications\Mail\Console;

use Academorix\Console\Attributes\AsCommand;
use Academorix\Console\Commands\BaseCommand;
use Academorix\Notifications\Mail\Contracts\Data\MailSuppressionInterface;
use Academorix\Notifications\Mail\Contracts\Repositories\MailSuppressionRepositoryInterface;
use Academorix\Notifications\Mail\Enums\MailSuppressionReason;
use Academorix\Notifications\Mail\Models\MailSuppression;

/**
 * `php artisan notifications:mail:suppression-remove` — revoke a
 * suppression from the CLI.
 *
 * Refused for `hard_bounce`, `complaint`, `spam_trap` rows unless
 * `--force` is passed AND the operator is a super_admin (verified
 * externally to this command — the flag is the operator's
 * assertion; audit-log picks up who ran it).
 *
 * Blueprint reference:
 *   modules/notifications/blueprints/notifications-mail/commands.json
 *
 * @category NotificationsMail
 *
 * @since    0.1.0
 */
#[AsCommand(
    name: 'notifications:mail:suppression-remove',
    description: 'Revoke a mail suppression.',
)]
final class SuppressionRemoveCommand extends BaseCommand
{
    /**
     * @var string
     */
    protected $signature = 'notifications:mail:suppression-remove
        {email : Address to revoke}
        {--tenant= : Owning tenant id (omit to revoke platform-wide row)}
        {--force : Allow revoking hard_bounce / complaint / spam_trap rows}';

    /**
     * Remove the suppression.
     */
    public function handle(MailSuppressionRepositoryInterface $suppressions): int
    {
        $this->omni->titleBar('Remove Mail Suppression', 'sky');

        $email = \strtolower(\trim((string) $this->argument('email')));
        if ($email === '') {
            $this->omni->error('The email argument is required.');
            $this->showDuration();

            return self::FAILURE;
        }

        $tenantId = $this->option('tenant');
        $tenantId = \is_string($tenantId) && $tenantId !== '' ? $tenantId : null;

        $row = $suppressions->findMatching($email, $tenantId);

        if ($row === null) {
            $this->omni->error(\sprintf('No suppression matched "%s".', $email));
            $this->showDuration();

            return self::FAILURE;
        }

        $reasonRaw = $row->{MailSuppressionInterface::ATTR_REASON};
        $reason = \is_object($reasonRaw) && \property_exists($reasonRaw, 'value')
            ? (string) $reasonRaw->value
            : (string) $reasonRaw;

        $protected = [
            MailSuppressionReason::HardBounce->value,
            MailSuppressionReason::Complaint->value,
            MailSuppressionReason::SpamTrap->value,
        ];

        if (\in_array($reason, $protected, true) && ! (bool) $this->option('force')) {
            $this->omni->error(\sprintf(
                'Cannot revoke a "%s" row without --force.',
                $reason,
            ));
            $this->showDuration();

            return self::FAILURE;
        }

        $isSystem = (bool) $row->{MailSuppressionInterface::ATTR_IS_SYSTEM};

        if ($isSystem && \method_exists(MailSuppression::class, 'allowSystemMutation')) {
            /** @var callable(): mixed $deleter */
            $deleter = static fn () => $suppressions->delete((string) $row->getKey());

            MailSuppression::allowSystemMutation($deleter);
        } else {
            $suppressions->delete((string) $row->getKey());
        }

        $this->omni->success(\sprintf(
            'Revoked suppression for "%s" (reason=%s).',
            $email,
            $reason,
        ));
        $this->showDuration();

        return self::SUCCESS;
    }
}
