<?php

declare(strict_types=1);

namespace Academorix\Notifications\Mail\Console;

use Academorix\Console\Attributes\AsCommand;
use Academorix\Console\Commands\BaseCommand;
use Academorix\Notifications\Mail\Contracts\Repositories\MailSuppressionRepositoryInterface;

/**
 * `php artisan notifications:mail:prune-expired` — soft-delete
 * expired soft-bounce suppressions.
 *
 * Runs daily at 03:30 UTC via the scheduler (blueprint
 * `schedule.json`). Never touches `hard_bounce`, `complaint`,
 * `manual`, or `spam_trap` rows — their `expires_at` column is
 * NULL so the pruner query filters them out.
 *
 * Blueprint reference:
 *   modules/notifications/blueprints/notifications-mail/commands.json
 *
 * @category NotificationsMail
 *
 * @since    0.1.0
 */
#[AsCommand(
    name: 'notifications:mail:prune-expired',
    description: 'Soft-delete expired soft-bounce mail suppressions.',
)]
final class PruneExpiredCommand extends BaseCommand
{
    /**
     * Run the pruner.
     */
    public function handle(MailSuppressionRepositoryInterface $suppressions): int
    {
        $this->omni->titleBar('Prune Expired Mail Suppressions', 'sky');

        $deleted = $suppressions->pruneExpired(\now());

        $this->omni->success(\sprintf(
            'Pruned %d expired soft-bounce suppression(s).',
            $deleted,
        ));
        $this->showDuration();

        return self::SUCCESS;
    }
}
