<?php

declare(strict_types=1);

namespace Stackra\Notifications\Mail\Contracts\Services;

use Stackra\Notifications\Mail\Services\MailProviderWebhookIngestor;
use Illuminate\Container\Attributes\Bind;

/**
 * Normalise a provider-specific webhook payload into the module's
 * canonical event stream.
 *
 * Every provider ships a slightly different payload shape for
 * "delivered", "opened", "clicked", "bounced", "complaint"
 * (`bounce_kind` semantics diverge in particular). The ingestor
 * takes the raw provider payload and dispatches the canonical
 * events:
 *
 *   * {@see \Stackra\Notifications\Mail\Events\MailDelivered}
 *   * {@see \Stackra\Notifications\Mail\Events\MailOpened}
 *   * {@see \Stackra\Notifications\Mail\Events\MailClicked}
 *   * {@see \Stackra\Notifications\Mail\Events\MailBounced}
 *   * {@see \Stackra\Notifications\Mail\Events\MailComplaint}
 *
 * A payload the ingestor cannot map (unknown event type, missing
 * `provider_message_id`) is logged + acknowledged as a no-op — the
 * outer job caller retries only when the payload is well-formed
 * but the DB layer errored.
 *
 * @category NotificationsMail
 *
 * @since    0.1.0
 */
#[Bind(MailProviderWebhookIngestor::class)]
interface MailProviderWebhookIngestorInterface
{
    /**
     * Ingest one provider webhook envelope.
     *
     * @param  string                $provider  Provider slug.
     * @param  array<string, mixed>  $payload   Decoded JSON payload
     *                                          from the webhook.
     * @param  array<string, mixed>  $headers   Sanitised request headers.
     */
    public function ingest(string $provider, array $payload, array $headers): void;
}
