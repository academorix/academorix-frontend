<?php

declare(strict_types=1);

namespace Stackra\Notifications\Sms\Console;

use Stackra\Console\Commands\BaseCommand;
use Stackra\Notifications\Sms\Jobs\SendSmsJob;
use Illuminate\Support\Str;
use Stackra\Console\Attributes\AsCommand;

/**
 * `notifications:sms:test` — send a synthetic SMS.
 *
 * Rate-limited by the shared operator throttle + refused in production
 * without `--allow-production`.
 *
 * @category NotificationsSms
 *
 * @since    0.1.0
 */
#[AsCommand(
    name: 'notifications:sms:test',
    description: 'Send a synthetic SMS via the configured provider.',
)]
final class TestCommand extends BaseCommand
{
    /**
     * @var string
     */
    protected $signature = 'notifications:sms:test {phone} {--tenant=} {--provider=twilio} {--body=Hello from notifications:sms:test} {--allow-production}';

    public function handle(): int
    {
        if (\app()->environment('production') && ! (bool) $this->option('allow-production')) {
            $this->omni->error('Refusing to run in production without --allow-production.');

            return self::FAILURE;
        }

        $tenantId = (string) ($this->option('tenant') ?? 'test');
        $phone    = (string) $this->argument('phone');
        $provider = (string) $this->option('provider');
        $body     = (string) $this->option('body');

        SendSmsJob::dispatch(
            notificationId: 'noti_' . Str::ulid()->toBase32(),
            deliveryId: 'ndlv_' . Str::ulid()->toBase32(),
            tenantId: $tenantId,
            provider: $provider,
            phone: $phone,
            body: $body,
        );

        $this->omni->success('Test SMS dispatched.');

        return self::SUCCESS;
    }
}
