<?php

declare(strict_types=1);

namespace Stackra\Notifications\Mail\Services;

use Stackra\Notifications\Mail\Contracts\Services\MailProviderWebhookIngestorInterface;
use Stackra\Notifications\Mail\Events\MailBounced;
use Stackra\Notifications\Mail\Events\MailClicked;
use Stackra\Notifications\Mail\Events\MailComplaint;
use Stackra\Notifications\Mail\Events\MailDelivered;
use Stackra\Notifications\Mail\Events\MailOpened;
use DateTimeImmutable;
use Illuminate\Container\Attributes\Log;
use Illuminate\Container\Attributes\Singleton;
use Psr\Log\LoggerInterface;

/**
 * Default {@see MailProviderWebhookIngestorInterface} implementation.
 *
 * Provider payloads are wildly non-uniform — Mailgun ships one
 * event per POST wrapped in an `event-data` envelope; SendGrid ships
 * an array of events; SES uses SNS `Notification` envelopes;
 * Postmark ships one event with a `RecordType` discriminator;
 * Resend uses a `type` discriminator like `email.delivered`.
 *
 * The ingestor dispatches to per-provider normaliser methods that
 * map each event kind into the canonical event stream:
 *
 *   * `delivered` → {@see MailDelivered}
 *   * `opened`    → {@see MailOpened}
 *   * `clicked`   → {@see MailClicked}
 *   * `bounced`   → {@see MailBounced} (with hard / soft kind)
 *   * `complaint` → {@see MailComplaint}
 *
 * `#[Singleton]` — stateless.
 *
 * @category NotificationsMail
 *
 * @since    0.1.0
 */
#[Singleton]
final class MailProviderWebhookIngestor implements MailProviderWebhookIngestorInterface
{
    /**
     * @param  LoggerInterface  $log  Structured logger.
     */
    public function __construct(
        #[Log] private readonly LoggerInterface $log,
    ) {
    }

    /**
     * {@inheritDoc}
     */
    public function ingest(string $provider, array $payload, array $headers): void
    {
        $notificationId = $this->extractNotificationId($headers);

        // Provider-specific dispatch. We keep the branching flat +
        // explicit so a new provider is one obvious method to add,
        // not a whole strategy pattern to wire up.
        match ($provider) {
            'mailgun'  => $this->ingestMailgun($payload, $notificationId),
            'sendgrid' => $this->ingestSendgrid($payload, $notificationId),
            'aws-ses'  => $this->ingestSes($payload, $notificationId),
            'postmark' => $this->ingestPostmark($payload, $notificationId),
            'resend'   => $this->ingestResend($payload, $notificationId),
            default    => $this->logUnknown($provider),
        };
    }

    /**
     * Mailgun — `event-data` envelope.
     *
     * @param  array<string, mixed>  $payload
     */
    private function ingestMailgun(array $payload, ?string $notificationId): void
    {
        /** @var array<string, mixed> $event */
        $event = \is_array($payload['event-data'] ?? null)
            ? $payload['event-data']
            : $payload;

        $type = (string) ($event['event'] ?? '');
        $messageId = $this->coerceString($event['message']['headers']['message-id'] ?? null);
        $timestamp = $this->coerceDate($event['timestamp'] ?? null);
        $recipient = (string) ($event['recipient'] ?? '');

        $this->fire(
            $type,
            provider: 'mailgun',
            notificationId: $notificationId,
            deliveryId: $notificationId ?? '',
            providerMessageId: $messageId,
            recipientEmail: $recipient,
            timestamp: $timestamp,
            payload: $event,
        );
    }

    /**
     * SendGrid — array of events.
     *
     * @param  array<string, mixed>  $payload
     */
    private function ingestSendgrid(array $payload, ?string $notificationId): void
    {
        $events = \array_values($payload);

        foreach ($events as $event) {
            if (! \is_array($event)) {
                continue;
            }

            /** @var array<string, mixed> $event */
            $type      = (string) ($event['event'] ?? '');
            $messageId = $this->coerceString($event['sg_message_id'] ?? null);
            $timestamp = $this->coerceDate($event['timestamp'] ?? null);
            $recipient = (string) ($event['email'] ?? '');

            $this->fire(
                $type,
                provider: 'sendgrid',
                notificationId: $notificationId,
                deliveryId: $notificationId ?? '',
                providerMessageId: $messageId,
                recipientEmail: $recipient,
                timestamp: $timestamp,
                payload: $event,
            );
        }
    }

    /**
     * AWS SES — SNS envelope, event type from `notificationType`.
     *
     * @param  array<string, mixed>  $payload
     */
    private function ingestSes(array $payload, ?string $notificationId): void
    {
        // SNS wraps the actual event inside a JSON-encoded Message
        // field.
        $message = $payload['Message'] ?? null;
        $event = \is_string($message)
            ? \json_decode($message, associative: true)
            : (\is_array($message) ? $message : $payload);

        if (! \is_array($event)) {
            return;
        }

        /** @var array<string, mixed> $event */
        $type = (string) ($event['notificationType'] ?? $event['eventType'] ?? '');
        $mail = \is_array($event['mail'] ?? null) ? $event['mail'] : [];
        $messageId = $this->coerceString($mail['messageId'] ?? null);
        $timestamp = $this->coerceDate($event['timestamp'] ?? $mail['timestamp'] ?? null);
        $recipient = '';
        $destination = $mail['destination'] ?? [];
        if (\is_array($destination) && $destination !== []) {
            $recipient = (string) \reset($destination);
        }

        $this->fire(
            $type,
            provider: 'aws-ses',
            notificationId: $notificationId,
            deliveryId: $notificationId ?? '',
            providerMessageId: $messageId,
            recipientEmail: $recipient,
            timestamp: $timestamp,
            payload: $event,
        );
    }

    /**
     * Postmark — one event per POST with `RecordType` discriminator.
     *
     * @param  array<string, mixed>  $payload
     */
    private function ingestPostmark(array $payload, ?string $notificationId): void
    {
        $type = (string) ($payload['RecordType'] ?? '');
        $messageId = $this->coerceString($payload['MessageID'] ?? null);
        $timestamp = $this->coerceDate($payload['DeliveredAt'] ?? $payload['BouncedAt'] ?? $payload['ReceivedAt'] ?? null);
        $recipient = (string) ($payload['Recipient'] ?? $payload['Email'] ?? '');

        $this->fire(
            $type,
            provider: 'postmark',
            notificationId: $notificationId,
            deliveryId: $notificationId ?? '',
            providerMessageId: $messageId,
            recipientEmail: $recipient,
            timestamp: $timestamp,
            payload: $payload,
        );
    }

    /**
     * Resend — `type` discriminator like `email.delivered`.
     *
     * @param  array<string, mixed>  $payload
     */
    private function ingestResend(array $payload, ?string $notificationId): void
    {
        $type = (string) ($payload['type'] ?? '');
        $data = \is_array($payload['data'] ?? null) ? $payload['data'] : [];

        $messageId = $this->coerceString($data['email_id'] ?? null);
        $timestamp = $this->coerceDate($data['created_at'] ?? $payload['created_at'] ?? null);
        $recipient = '';
        $toField = $data['to'] ?? null;
        if (\is_string($toField)) {
            $recipient = $toField;
        } elseif (\is_array($toField) && $toField !== []) {
            $recipient = (string) \reset($toField);
        }

        $this->fire(
            $type,
            provider: 'resend',
            notificationId: $notificationId,
            deliveryId: $notificationId ?? '',
            providerMessageId: $messageId,
            recipientEmail: $recipient,
            timestamp: $timestamp,
            payload: $payload,
        );
    }

    /**
     * Fire the canonical event for a normalised event type.
     *
     * @param  array<string, mixed>  $payload  Raw provider event for logging.
     */
    private function fire(
        string $type,
        string $provider,
        ?string $notificationId,
        string $deliveryId,
        ?string $providerMessageId,
        string $recipientEmail,
        \DateTimeInterface $timestamp,
        array $payload,
    ): void {
        $canonical = $this->canonicalType($type);

        if ($canonical === null) {
            $this->log->info('notifications-mail: unmapped provider event type', [
                'provider' => $provider,
                'type'     => $type,
            ]);

            return;
        }

        if ($notificationId === null) {
            $this->log->info('notifications-mail: webhook missing X-Stackra-Notification-Id — cannot correlate', [
                'provider' => $provider,
                'type'     => $type,
            ]);

            return;
        }

        switch ($canonical) {
            case 'delivered':
                if ($providerMessageId === null) {
                    return;
                }

                MailDelivered::dispatch(
                    $notificationId,
                    $deliveryId,
                    $provider,
                    $providerMessageId,
                    $timestamp,
                );

                return;

            case 'opened':
                MailOpened::dispatch(
                    $notificationId,
                    $deliveryId,
                    $provider,
                    $timestamp,
                    $this->coerceString($payload['ip'] ?? $payload['UserIp'] ?? null),
                    $this->coerceString($payload['user-agent'] ?? $payload['UserAgent'] ?? null),
                );

                return;

            case 'clicked':
                $clickedUrl = $this->coerceString(
                    $payload['url'] ?? $payload['OriginalLink'] ?? $payload['click']['url'] ?? '',
                );

                MailClicked::dispatch(
                    $notificationId,
                    $deliveryId,
                    $provider,
                    (string) $clickedUrl,
                    $timestamp,
                );

                return;

            case 'bounced_hard':
            case 'bounced_soft':
                MailBounced::dispatch(
                    $notificationId,
                    $deliveryId,
                    $provider,
                    $canonical === 'bounced_hard' ? 'hard' : 'soft',
                    $this->coerceString($payload['reason'] ?? $payload['Description'] ?? '') ?? '',
                    $recipientEmail,
                    $timestamp,
                );

                return;

            case 'complaint':
                MailComplaint::dispatch(
                    $notificationId,
                    $deliveryId,
                    $provider,
                    $recipientEmail,
                    $timestamp,
                );

                return;
        }
    }

    /**
     * Normalise a provider event type into the canonical set.
     *
     * Returns one of: `delivered`, `opened`, `clicked`,
     * `bounced_hard`, `bounced_soft`, `complaint`, or `null` when
     * the type is not one we act on.
     */
    private function canonicalType(string $type): ?string
    {
        $normalised = \strtolower(\str_replace(['email.', 'Email.'], '', $type));

        return match ($normalised) {
            'delivered', 'delivery' => 'delivered',
            'open', 'opened'         => 'opened',
            'click', 'clicked'       => 'clicked',
            'bounce', 'bounced', 'permanent', 'bounced_hard'
                => 'bounced_hard',
            'dropped', 'deferred', 'blocked', 'transient', 'bounced_soft'
                => 'bounced_soft',
            'complaint', 'spamreport', 'complained', 'spamcomplaint'
                => 'complaint',
            default => null,
        };
    }

    /**
     * Read the `X-Stackra-Notification-Id` correlation header.
     *
     * @param  array<string, mixed>  $headers
     */
    private function extractNotificationId(array $headers): ?string
    {
        foreach ($headers as $name => $value) {
            if (\strtolower((string) $name) !== 'x-stackra-notification-id') {
                continue;
            }

            if (\is_array($value)) {
                $value = \reset($value);
            }

            $string = \is_scalar($value) ? (string) $value : '';

            return $string === '' ? null : $string;
        }

        return null;
    }

    /**
     * Coerce a nullable value to a nullable string.
     */
    private function coerceString(mixed $raw): ?string
    {
        if ($raw === null) {
            return null;
        }

        if (! \is_scalar($raw)) {
            return null;
        }

        $value = (string) $raw;

        return $value === '' ? null : $value;
    }

    /**
     * Coerce a raw timestamp (unix int, ISO 8601 string) to a
     * `DateTimeInterface`. Falls back to `now()`.
     */
    private function coerceDate(mixed $raw): \DateTimeInterface
    {
        if (\is_int($raw) || (\is_string($raw) && \ctype_digit($raw))) {
            return new DateTimeImmutable('@' . (int) $raw);
        }

        if (\is_string($raw) && $raw !== '') {
            try {
                return new DateTimeImmutable($raw);
            } catch (\Throwable) {
                // Fall through.
            }
        }

        return new DateTimeImmutable();
    }

    /**
     * Log an unknown provider slug — the middleware already rejected
     * signatures for unknown providers, so reaching here means the
     * verifier accepted but the ingestor doesn't know how to parse.
     */
    private function logUnknown(string $provider): void
    {
        $this->log->warning('notifications-mail: no ingestor for provider', [
            'provider' => $provider,
        ]);
    }
}
