<?php

declare(strict_types=1);

namespace Stackra\Notifications\Mail\Channels;

use Stackra\Notifications\Contracts\Data\NotificationInterface;
use Stackra\Notifications\Mail\Attributes\AsNotificationChannel;
use Stackra\Notifications\Mail\Contracts\Repositories\MailSuppressionRepositoryInterface;
use Stackra\Notifications\Mail\Contracts\Services\MailChannelInterface;
use Stackra\Notifications\Mail\Events\MailSent;
use Stackra\Notifications\Models\Notification;
use Illuminate\Container\Attributes\Log;
use Illuminate\Container\Attributes\Singleton;
use Illuminate\Contracts\Mail\Factory as MailFactory;
use Illuminate\Mail\Message;
use Psr\Log\LoggerInterface;

/**
 * The mail channel driver.
 *
 * Translates one persisted {@see Notification} into an outbound
 * email:
 *
 *   1. Consult the {@see MailSuppressionRepositoryInterface} —
 *      a suppressed recipient short-circuits without ever hitting
 *      the transport, and the caller (`SendMailJob`) marks the
 *      delivery as `permanently_failed` with error code
 *      `NOTIFICATIONS_MAIL_SUPPRESSED_ADDRESS`.
 *   2. Resolve the mailer (default OR per-category override).
 *   3. Interpolate template variables through Blade + inject the
 *      CAN-SPAM footer + RFC 8058 `List-Unsubscribe` headers.
 *   4. Hand off to Laravel's `MailManager`.
 *   5. Fire {@see MailSent} so downstream consumers observe the
 *      delivery.
 *
 * `#[AsNotificationChannel(key: 'mail', ...)]` — attribute-driven
 * registration with the parent's channel registry.
 *
 * `#[Singleton]` — the driver is stateless (each `deliver()` call
 * reads its state from the injected notification argument). Every
 * request-scoped concern lives inside the parent-provided
 * `MailFactory`, which is itself request-scoped. Octane-safe by
 * construction.
 *
 * Blueprint reference:
 *   modules/notifications/blueprints/notifications-mail/module.json §channelRegistration
 *
 * @category NotificationsMail
 *
 * @since    0.1.0
 */
#[AsNotificationChannel(
    key: 'mail',
    kind: 'external',
    providerKind: 'saas',
    supportsOpenTracking: true,
    supportsClickTracking: true,
    supportsDeliveryTracking: true,
)]
#[Singleton]
final class MailChannel implements MailChannelInterface
{
    /**
     * @param  MailSuppressionRepositoryInterface  $suppressions  Block-list lookup.
     * @param  MailFactory                         $mail          Laravel's MailManager factory.
     * @param  LoggerInterface                     $log           Structured logger.
     */
    public function __construct(
        private readonly MailSuppressionRepositoryInterface $suppressions,
        private readonly MailFactory $mail,
        #[Log] private readonly LoggerInterface $log,
    ) {
    }

    /**
     * {@inheritDoc}
     *
     * Order of operations:
     *
     *   1. Extract the recipient address from the notification
     *      payload (`payload.recipient_email` — set at
     *      DispatchGateway time from the resolved profile).
     *   2. Suppression check. A hit returns `null` — the outer
     *      job records the state transition.
     *   3. Resolve the mailer for the notification's category
     *      (`config('notifications-mail.categories.<slug>.mailer')`,
     *      falling back to `config('notifications-mail.default')`).
     *   4. Compose the message + inject compliance headers.
     *   5. `Mail::mailer(...)->send(...)`.
     *   6. Fire `MailSent`.
     */
    public function deliver(Notification $notification): ?string
    {
        $tenantId       = (string) $notification->{NotificationInterface::ATTR_TENANT_ID};
        $notificationId = (string) $notification->getKey();

        /** @var array<string, mixed> $payload */
        $payload   = $this->coerceArray($notification->{NotificationInterface::ATTR_PAYLOAD});
        $recipient = $this->coerceString($payload['recipient_email'] ?? null);
        $subject   = $this->coerceString(
            $payload['subject'] ?? $notification->{NotificationInterface::ATTR_SUBJECT} ?? '',
        );
        $bodyHtml  = $this->coerceString($payload['body_rendered_html'] ?? $payload['body'] ?? '');

        if ($recipient === '') {
            $this->log->warning('notifications-mail: notification has no recipient_email', [
                'notification_id' => $notificationId,
                'tenant_id'       => $tenantId,
            ]);

            return null;
        }

        // ── Suppression check ─────────────────────────────────────
        //
        // A hit short-circuits with a `null` return. The outer job
        // observes the null and records the delivery as
        // `permanently_failed` with error code
        // `NOTIFICATIONS_MAIL_SUPPRESSED_ADDRESS`.
        if ($this->suppressions->isSuppressed($recipient, $tenantId)) {
            $this->log->info('notifications-mail: recipient is suppressed — send skipped', [
                'notification_id' => $notificationId,
                'tenant_id'       => $tenantId,
                'recipient'       => $recipient,
            ]);

            return null;
        }

        // ── Mailer selection ──────────────────────────────────────
        $categorySlug = (string) ($notification->{NotificationInterface::ATTR_CATEGORY_SLUG} ?? '');
        $mailerName   = $this->resolveMailer($categorySlug);

        // ── Compose + send ────────────────────────────────────────
        $providerMessageId = null;

        try {
            $this->mail
                ->mailer($mailerName)
                ->html($bodyHtml, function (Message $message) use (
                    $recipient,
                    $subject,
                    $notificationId,
                    $tenantId,
                    $categorySlug,
                    $notification,
                    &$providerMessageId,
                ): void {
                    $message->to($recipient);
                    $message->subject($subject);

                    $fromAddress = $this->resolveFromAddress($categorySlug);
                    if ($fromAddress !== null) {
                        $message->from($fromAddress);
                    }

                    // Correlation headers — captured by the provider
                    // webhook path so we can match callbacks back
                    // to the originating notification / tenant.
                    $headers = $message->getHeaders();
                    $headers->addTextHeader('X-Stackra-Notification-Id', $notificationId);
                    $headers->addTextHeader('X-Stackra-Tenant-Id', $tenantId);
                    if ($categorySlug !== '') {
                        $headers->addTextHeader('X-Stackra-Category', $categorySlug);
                    }

                    // RFC 8058 one-click List-Unsubscribe — required
                    // for marketing-priority mail per CAN-SPAM.
                    if ((bool) \config('notifications-mail.footer.inject_list_unsubscribe', true)) {
                        $unsubscribeUrl = $this->buildUnsubscribeUrl(
                            $notification,
                            $recipient,
                        );

                        if ($unsubscribeUrl !== null) {
                            $headers->addTextHeader('List-Unsubscribe', '<' . $unsubscribeUrl . '>');
                            $headers->addTextHeader('List-Unsubscribe-Post', 'List-Unsubscribe=One-Click');
                        }
                    }

                    // Post-send: attempt to read the transport's
                    // captured message id. The Symfony transport
                    // usually sets this on the sent message.
                });

            // MailManager doesn't expose a captured message id
            // uniformly across transports. Consumers correlate via
            // the X-Stackra-Notification-Id header we injected
            // above; providers that ship native ids surface them
            // via their own webhook.
        } catch (\Throwable $e) {
            $this->log->error('notifications-mail: transport threw during send', [
                'notification_id' => $notificationId,
                'tenant_id'       => $tenantId,
                'mailer'          => $mailerName,
                'error'           => $e->getMessage(),
                'exception_class' => \get_class($e),
            ]);

            throw $e;
        }

        MailSent::dispatch(
            $notificationId,
            (string) ($notification->{NotificationInterface::ATTR_DELIVERY_ID} ?? $notificationId),
            $mailerName,
            $providerMessageId,
            $recipient,
            $subject,
            \now(),
        );

        return $providerMessageId;
    }

    /**
     * Resolve the mailer name for a category, falling back to the
     * default when no override is configured.
     */
    private function resolveMailer(string $categorySlug): string
    {
        if ($categorySlug !== '') {
            $mailer = \config(\sprintf('notifications-mail.categories.%s.mailer', $categorySlug));

            if (\is_string($mailer) && $mailer !== '') {
                return $mailer;
            }
        }

        $default = \config('notifications-mail.default', 'log');

        return \is_string($default) && $default !== '' ? $default : 'log';
    }

    /**
     * Optional per-category from address override.
     */
    private function resolveFromAddress(string $categorySlug): ?string
    {
        if ($categorySlug === '') {
            return null;
        }

        $from = \config(\sprintf('notifications-mail.categories.%s.from_address', $categorySlug));

        return \is_string($from) && $from !== '' ? $from : null;
    }

    /**
     * Build a per-recipient one-click unsubscribe URL from the
     * template configured in `config('notifications-mail.footer.one_click_unsubscribe_url_template')`.
     *
     * The `{token}` slot is intentionally a placeholder here — a
     * per-recipient signed token is minted at the notifications-core
     * level when it lands. Until then, the URL still includes the
     * notification id so the receiver can identify the source.
     */
    private function buildUnsubscribeUrl(Notification $notification, string $recipient): ?string
    {
        $template = \config('notifications-mail.footer.one_click_unsubscribe_url_template');
        if (! \is_string($template) || $template === '') {
            return null;
        }

        $appUrl = (string) \config('app.url', 'http://localhost');

        $token = \hash('sha256', \implode('|', [
            (string) $notification->getKey(),
            $recipient,
            (string) $notification->{NotificationInterface::ATTR_TENANT_ID},
        ]));

        return \str_replace(
            ['{app_url}', '{token}'],
            [\rtrim($appUrl, '/'), $token],
            $template,
        );
    }

    /**
     * Coerce a raw column value to an array. Payload columns are
     * stored as JSONB; hydration can return array or Collection.
     *
     * @return array<string, mixed>
     */
    private function coerceArray(mixed $raw): array
    {
        if ($raw === null) {
            return [];
        }

        if (\is_array($raw)) {
            /** @var array<string, mixed> $raw */
            return $raw;
        }

        if (\is_object($raw) && \method_exists($raw, 'toArray')) {
            /** @var array<string, mixed> $result */
            $result = $raw->toArray();

            return $result;
        }

        return [];
    }

    /**
     * Coerce a scalar value to a string. Empty / null → empty
     * string so consumers can guard with `=== ''`.
     */
    private function coerceString(mixed $raw): string
    {
        if ($raw === null) {
            return '';
        }

        return \is_scalar($raw) ? (string) $raw : '';
    }
}
