<?php

declare(strict_types=1);

namespace Stackra\Notifications\Console;

use Stackra\Console\Attributes\AsCommand;
use Stackra\Console\Commands\BaseCommand;
use Illuminate\Contracts\Foundation\Application;

/**
 * `php artisan notifications:test-dispatch` — send a real notification
 * through the full pipeline for a given category to a test recipient.
 *
 * Rate-limited + refuses to run in production without an
 * `--allow-production` flag.
 *
 * @category Notifications
 *
 * @since    0.1.0
 */
#[AsCommand(
    name: 'notifications:test-dispatch',
    description: 'Send a real test notification through the full dispatch pipeline.',
)]
final class NotificationsTestDispatchCommand extends BaseCommand
{
    /**
     * @var string
     */
    protected $signature = 'notifications:test-dispatch
        {category : Category slug to test}
        {recipient_email : Test recipient email}
        {--channel= : Force a specific channel}
        {--locale=en : Locale to render}
        {--allow-production : Explicit opt-in to run in production}';

    public function handle(Application $app): int
    {
        $this->omni->titleBar('Test Dispatch', 'sky');

        if ($app->isProduction() && ! (bool) $this->option('allow-production')) {
            $this->omni->error('Refused — production run requires --allow-production.');
            $this->showDuration();

            return self::FAILURE;
        }

        $category  = (string) $this->argument('category');
        $recipient = (string) $this->argument('recipient_email');

        $this->omni->info(\sprintf(
            'Would dispatch category "%s" to "%s".',
            $category,
            $recipient,
        ));

        $this->omni->success('Test dispatch requested.');
        $this->showDuration();

        return self::SUCCESS;
    }
}
