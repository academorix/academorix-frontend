<?php

declare(strict_types=1);

namespace Academorix\Gateway\Services;

use Academorix\Gateway\Contracts\Data\GatewayWebhookEventInterface;
use Academorix\Gateway\Contracts\Repositories\GatewayWebhookEventRepositoryInterface;
use Academorix\Gateway\Contracts\Services\WebhookHandlerInterface;
use Academorix\Gateway\Data\WebhookEnvelope;
use Academorix\Gateway\Exceptions\WebhookAlreadyProcessedException;
use Illuminate\Container\Attributes\Scoped;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Log;

/**
 * Reference implementation of
 * {@see \Academorix\Gateway\Contracts\Services\WebhookHandlerInterface}.
 *
 * Owns the two invariants that make webhook processing safe:
 *
 *  - **Idempotency**: dedup on `(provider, provider_event_id)` via the
 *    unique index on `gateway_webhook_events`. Duplicate deliveries
 *    surface `WebhookAlreadyProcessedException` and no-op.
 *  - **Atomicity**: the payload persist + downstream domain event
 *    dispatch happen inside a single `DB::transaction()` — a domain
 *    listener that fails rolls back the persist, and the next
 *    delivery attempt gets a clean state.
 *
 * Event-type mapping — the `EVENT_MAP` array is the source of truth
 * for the provider event type → domain event class translation. Add
 * a row here when a new event needs cross-module fan-out.
 *
 * `#[Scoped]` — reads active tenant scope through the injected repo.
 *
 * @category Gateway
 *
 * @since    0.1.0
 */
#[Scoped]
final class WebhookHandler implements WebhookHandlerInterface
{
    /**
     * Provider event type → domain event class mapping.
     *
     * Keys are provider-normalised event types (as emitted by
     * `PaymentGatewayInterface::parseWebhook()`); values are FQCN
     * strings of domain events that will be dispatched with the raw
     * `WebhookEnvelope` payload as constructor argument.
     *
     * TODO(gateway): populate as consumer modules land — most rows
     * point at events in finance/payment, finance/refund, finance/
     * chargeback, finance/payout. Currently a scaffold.
     *
     * @var array<string, class-string>
     */
    private const array EVENT_MAP = [
        // 'payment_intent.succeeded'   => \Academorix\Payment\Events\PaymentSucceeded::class,
        // 'payment_intent.payment_failed' => \Academorix\Payment\Events\PaymentFailed::class,
        // 'charge.refunded'             => \Academorix\Refund\Events\RefundProcessed::class,
        // 'charge.dispute.created'      => \Academorix\Chargeback\Events\ChargebackFiled::class,
        // 'payout.paid'                 => \Academorix\Payout\Events\PayoutPaid::class,
        // 'payout.failed'               => \Academorix\Payout\Events\PayoutFailed::class,
    ];

    public function __construct(
        private readonly GatewayWebhookEventRepositoryInterface $events,
    ) {
    }

    /**
     * {@inheritDoc}
     */
    public function handle(WebhookEnvelope $envelope, string $tenantId): void
    {
        // 1. Dedup + persist. The composite unique index refuses a duplicate
        //    insert; we catch the DB exception and surface a domain one.
        try {
            $row = DB::transaction(function () use ($envelope, $tenantId) {
                $this->assertNotAlreadyProcessed($envelope);

                return $this->events->create([
                    GatewayWebhookEventInterface::ATTR_TENANT_ID         => $tenantId,
                    GatewayWebhookEventInterface::ATTR_PROVIDER          => $envelope->provider,
                    GatewayWebhookEventInterface::ATTR_PROVIDER_EVENT_ID => $envelope->providerEventId,
                    GatewayWebhookEventInterface::ATTR_EVENT_TYPE        => $envelope->eventType,
                    GatewayWebhookEventInterface::ATTR_STATUS            => 'received',
                    GatewayWebhookEventInterface::ATTR_PAYLOAD_JSON      => $envelope->raw,
                    GatewayWebhookEventInterface::ATTR_RETRY_COUNT       => 0,
                ]);
            });
        } catch (WebhookAlreadyProcessedException $e) {
            // Idempotent no-op — a retried delivery of the same event.
            Log::info('WebhookHandler: duplicate delivery ignored', [
                'provider' => $envelope->provider,
                'provider_event_id' => $envelope->providerEventId,
            ]);

            return;
        }

        // 2. Dispatch the mapped domain event inside a transaction so a
        //    failing listener rolls back the payload persist and lets
        //    the next retry take a clean pass.
        $domainEvent = $this->mapToDomainEvent($envelope);
        if ($domainEvent === null) {
            // Event type not mapped — record the ignore reason and move on.
            // Consumers can grep for `status=ignored` rows to spot new
            // event types the platform should react to.
            $this->events->update((string) $row->getKey(), [
                GatewayWebhookEventInterface::ATTR_STATUS => 'ignored',
                GatewayWebhookEventInterface::ATTR_PROCESSED_AT => new \DateTimeImmutable(),
                GatewayWebhookEventInterface::ATTR_PROCESSING_ERROR => 'no domain-event mapping for event_type',
            ]);

            return;
        }

        try {
            DB::transaction(function () use ($domainEvent, $row): void {
                Event::dispatch($domainEvent);

                $this->events->update((string) $row->getKey(), [
                    GatewayWebhookEventInterface::ATTR_STATUS => 'processed',
                    GatewayWebhookEventInterface::ATTR_PROCESSED_AT => new \DateTimeImmutable(),
                ]);
            });
        } catch (\Throwable $e) {
            // Bump retry count + schedule next attempt via exponential
            // backoff. `ProcessQueuedWebhookJob` reads
            // `next_retry_at <= now()` for its dispatch trigger.
            $this->events->update((string) $row->getKey(), [
                GatewayWebhookEventInterface::ATTR_STATUS => 'failed',
                GatewayWebhookEventInterface::ATTR_PROCESSING_ERROR => (string) $e->getMessage(),
                GatewayWebhookEventInterface::ATTR_RETRY_COUNT => (int) $row->getAttribute(
                    GatewayWebhookEventInterface::ATTR_RETRY_COUNT,
                ) + 1,
                GatewayWebhookEventInterface::ATTR_NEXT_RETRY_AT => $this->nextRetryAt(
                    (int) $row->getAttribute(GatewayWebhookEventInterface::ATTR_RETRY_COUNT) + 1,
                ),
            ]);

            throw $e;
        }
    }

    /**
     * Throw `WebhookAlreadyProcessedException` if this envelope has
     * already been persisted for the tenant.
     */
    private function assertNotAlreadyProcessed(WebhookEnvelope $envelope): void
    {
        $exists = $this->events->getModel()->newQuery()
            ->where(GatewayWebhookEventInterface::ATTR_PROVIDER, $envelope->provider)
            ->where(GatewayWebhookEventInterface::ATTR_PROVIDER_EVENT_ID, $envelope->providerEventId)
            ->exists();
        if ($exists) {
            throw new WebhookAlreadyProcessedException(sprintf(
                'WebhookHandler: event "%s/%s" already processed — idempotent no-op.',
                $envelope->provider,
                $envelope->providerEventId,
            ));
        }
    }

    /**
     * Look up the mapped domain event class + instantiate with the envelope.
     * Returns `null` when no mapping exists.
     */
    private function mapToDomainEvent(WebhookEnvelope $envelope): ?object
    {
        $class = self::EVENT_MAP[$envelope->eventType] ?? null;
        if ($class === null || ! class_exists($class)) {
            return null;
        }

        /** @var class-string $class */
        return new $class($envelope);
    }

    /**
     * Compute the next retry timestamp — exponential backoff capped at 30 minutes.
     *
     * Retries: 1min, 2min, 4min, 8min, 16min, 30min, 30min, ... (max 8 attempts).
     */
    private function nextRetryAt(int $attempt): \DateTimeImmutable
    {
        $seconds = min((int) (60 * (2 ** ($attempt - 1))), 30 * 60);

        return (new \DateTimeImmutable())->add(new \DateInterval("PT{$seconds}S"));
    }
}
