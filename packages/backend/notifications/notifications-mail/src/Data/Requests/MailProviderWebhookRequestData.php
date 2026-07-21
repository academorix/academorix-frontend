<?php

declare(strict_types=1);

namespace Stackra\Notifications\Mail\Data\Requests;

use Spatie\LaravelData\Data;

/**
 * Envelope for an inbound provider webhook payload.
 *
 * Providers ship wildly different shapes — this DTO models the
 * common outer envelope
 * ({@see \Stackra\Notifications\Mail\Actions\Central\ReceiveMailWebhook}
 * captures `provider`, `payload`, `headers` and hands them straight
 * to the normalisation job). Provider-specific parsing lives inside
 * {@see \Stackra\Notifications\Mail\Contracts\Services\MailProviderWebhookIngestorInterface}.
 *
 * `Data` intentionally has NO validation attributes — the middleware
 * has already verified the signature; downstream normalisation
 * gates missing fields with structured logs, not validation errors.
 *
 * @category NotificationsMail
 *
 * @since    0.1.0
 */
final class MailProviderWebhookRequestData extends Data
{
    /**
     * @param  string                $provider  Provider slug.
     * @param  array<string, mixed>  $payload   Decoded JSON body.
     * @param  array<string, mixed>  $headers   Sanitised headers.
     */
    public function __construct(
        public string $provider,
        public array $payload,
        public array $headers,
    ) {
    }
}
