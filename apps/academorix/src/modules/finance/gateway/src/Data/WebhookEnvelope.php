<?php

declare(strict_types=1);

namespace Academorix\Gateway\Data;

/**
 * Provider-agnostic webhook envelope.
 *
 * Every gateway driver parses its provider's raw webhook body into this
 * shape before handing it to `WebhookHandler` — which dedupes on
 * `(provider, providerEventId)` and dispatches the mapped domain event.
 *
 * @category Gateway
 *
 * @since    0.1.0
 */
final readonly class WebhookEnvelope
{
    /**
     * @param  string                $provider          Provider slug (`stripe`, `paddle`, ...).
     * @param  string                $providerEventId   Provider-side event id (Stripe `evt_*`) — the dedup key.
     * @param  string                $eventType         Normalised event type (`payment_intent.succeeded`,
     *                                                  `charge.refunded`, `charge.dispute.created`, ...).
     * @param  \DateTimeImmutable    $occurredAt        When the provider recorded the event.
     * @param  string|null           $providerIntentId  Parent intent id when applicable.
     * @param  array<string, mixed>  $data              Provider-parsed event payload (already validated for signature).
     * @param  array<string, mixed>  $raw               Full raw payload for downstream audit.
     */
    public function __construct(
        public string $provider,
        public string $providerEventId,
        public string $eventType,
        public \DateTimeImmutable $occurredAt,
        public ?string $providerIntentId = null,
        public array $data = [],
        public array $raw = [],
    ) {
    }
}
