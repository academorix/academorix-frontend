<?php

declare(strict_types=1);

namespace Stackra\Notifications\Mail\Console;

use Stackra\Console\Attributes\AsCommand;
use Stackra\Console\Commands\BaseCommand;
use Stackra\Notifications\Mail\Contracts\Data\MailSuppressionInterface;
use Stackra\Notifications\Mail\Contracts\Repositories\MailSuppressionRepositoryInterface;
use Stackra\Notifications\Mail\Enums\MailSuppressionReason;
use Stackra\Notifications\Mail\Models\MailSuppression;

/**
 * `php artisan notifications:mail:suppression-add` — add an address
 * to the mail suppression list from the CLI.
 *
 * Tenant-scoped rows require `--tenant=<id>`. Platform-wide rows
 * require `--platform-wide` and are `is_system=true`; only super_admin
 * operators should hold the CLI credentials to run this.
 *
 * Blueprint reference:
 *   modules/notifications/blueprints/notifications-mail/commands.json
 *
 * @category NotificationsMail
 *
 * @since    0.1.0
 */
#[AsCommand(
    name: 'notifications:mail:suppression-add',
    description: 'Manually add an email to the mail suppression list.',
)]
final class SuppressionAddCommand extends BaseCommand
{
    /**
     * @var string
     */
    protected $signature = 'notifications:mail:suppression-add
        {email : Address to block}
        {--tenant= : Owning tenant id (required unless --platform-wide)}
        {--reason=manual : Blocking reason (manual / spam_trap / hard_bounce / …)}
        {--platform-wide : Create a platform-wide is_system row}';

    /**
     * Add the suppression.
     */
    public function handle(MailSuppressionRepositoryInterface $suppressions): int
    {
        $this->omni->titleBar('Add Mail Suppression', 'sky');

        $email = \strtolower(\trim((string) $this->argument('email')));
        if ($email === '') {
            $this->omni->error('The email argument is required.');
            $this->showDuration();

            return self::FAILURE;
        }

        $platformWide = (bool) $this->option('platform-wide');
        $tenantId = $this->option('tenant');
        $tenantId = \is_string($tenantId) && $tenantId !== '' ? $tenantId : null;

        if ($platformWide && $tenantId !== null) {
            $this->omni->error('Cannot combine --platform-wide with --tenant.');
            $this->showDuration();

            return self::FAILURE;
        }

        if (! $platformWide && $tenantId === null) {
            $this->omni->error('Either --tenant=<id> or --platform-wide is required.');
            $this->showDuration();

            return self::FAILURE;
        }

        $reason = (string) $this->option('reason');
        if (MailSuppressionReason::tryFrom($reason) === null) {
            $this->omni->error(\sprintf('Unknown reason "%s".', $reason));
            $this->showDuration();

            return self::FAILURE;
        }

        $attributes = [
            MailSuppressionInterface::ATTR_TENANT_ID => $platformWide ? null : $tenantId,
            MailSuppressionInterface::ATTR_EMAIL     => $email,
            MailSuppressionInterface::ATTR_REASON    => $reason,
            MailSuppressionInterface::ATTR_IS_SYSTEM => $platformWide,
        ];

        if ($platformWide && \method_exists(MailSuppression::class, 'allowSystemMutation')) {
            /** @var callable(): MailSuppression $creator */
            $creator = static fn (): MailSuppression => $suppressions->create($attributes);

            $row = MailSuppression::allowSystemMutation($creator);
        } else {
            $row = $suppressions->create($attributes);
        }

        $this->omni->success(\sprintf(
            'Added suppression "%s" (id=%s, is_system=%s).',
            $email,
            (string) $row->getKey(),
            $platformWide ? 'true' : 'false',
        ));
        $this->showDuration();

        return self::SUCCESS;
    }
}
