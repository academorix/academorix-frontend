<?php

declare(strict_types=1);

namespace Academorix\Notifications\Mail\Console;

use Academorix\Console\Attributes\AsCommand;
use Academorix\Console\Commands\BaseCommand;
use Illuminate\Contracts\Mail\Factory as MailFactory;
use Illuminate\Mail\Message;

/**
 * `php artisan notifications:mail:test-send` — send a rendered
 * template to a real recipient via the specified provider (or
 * default).
 *
 * Rate-limited to 10 sends per day per operator (enforced by the
 * cache-based limiter in the base command's harness when landed).
 * Production sends are refused unless `--allow-production`.
 *
 * Blueprint reference:
 *   modules/notifications/blueprints/notifications-mail/commands.json
 *
 * @category NotificationsMail
 *
 * @since    0.1.0
 */
#[AsCommand(
    name: 'notifications:mail:test-send',
    description: 'Send a test email via the configured mail provider.',
)]
final class TestSendCommand extends BaseCommand
{
    /**
     * @var string
     */
    protected $signature = 'notifications:mail:test-send
        {recipient_email : Recipient address}
        {--template= : Template key to render (optional)}
        {--locale=en : Locale for the template render}
        {--provider= : Override the configured provider}
        {--allow-production : Permit sends in the production environment}';

    /**
     * Dispatch a real test send. Returns SUCCESS as soon as the
     * mailer accepts the message.
     */
    public function handle(MailFactory $mail): int
    {
        $this->omni->titleBar('Test Mail Send', 'sky');

        $recipient = (string) $this->argument('recipient_email');
        $provider  = $this->option('provider');
        $mailer    = \is_string($provider) && $provider !== ''
            ? $provider
            : (string) \config('notifications-mail.default', 'log');

        if (\app()->environment('production') && ! $this->option('allow-production')) {
            $this->omni->error('Refusing to send in production without --allow-production.');
            $this->showDuration();

            return self::FAILURE;
        }

        if ($recipient === '') {
            $this->omni->error('The recipient_email argument is required.');
            $this->showDuration();

            return self::FAILURE;
        }

        $subject = 'Academorix notifications-mail test send';
        $bodyHtml = '<p>This is a test email from the notifications-mail module.</p>';

        $mail->mailer($mailer)->html(
            $bodyHtml,
            static function (Message $message) use ($recipient, $subject): void {
                $message->to($recipient);
                $message->subject($subject);
            },
        );

        $this->omni->success(\sprintf(
            'Dispatched test send to "%s" via mailer "%s".',
            $recipient,
            $mailer,
        ));
        $this->showDuration();

        return self::SUCCESS;
    }
}
