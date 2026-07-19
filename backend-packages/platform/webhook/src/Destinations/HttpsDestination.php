<?php

declare(strict_types=1);

namespace Academorix\Webhook\Destinations;

use Academorix\Webhook\Attributes\AsWebhookDestination;
use Academorix\Webhook\Contracts\Data\WebhookDeliveryInterface;
use Academorix\Webhook\Contracts\Data\WebhookSubscriptionInterface;
use Academorix\Webhook\Contracts\Services\WebhookDestinationInterface;
use Academorix\Webhook\Contracts\Services\WebhookSignerInterface;
use Academorix\Webhook\Models\WebhookDelivery;
use Academorix\Webhook\Models\WebhookSubscription;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Http\Client\Factory as HttpFactory;

/**
 * Default HTTPS destination driver.
 *
 * POST / PUT / PATCH the payload to the destination URL. Attaches the
 * canonical `X-Webhook-*` header set (`X-Webhook-ID`,
 * `X-Webhook-Event`, `X-Webhook-Event-Version`, `X-Webhook-Timestamp`,
 * `X-Webhook-Signature`, `X-Webhook-Signature-Previous` during
 * rotation grace, `X-Webhook-Attempt`).
 *
 * @category Webhook
 *
 * @since    0.1.0
 */
#[AsWebhookDestination(
    name: 'https',
    supportsBatching: false,
    requiresConfig: ['url'],
)]
final class HttpsDestination implements WebhookDestinationInterface
{
    public function __construct(
        private readonly HttpFactory $http,
        private readonly WebhookSignerInterface $signer,
    ) {
    }

    /**
     * {@inheritDoc}
     */
    public function dispatch(
        WebhookDelivery $delivery,
        WebhookSubscription $subscription,
    ): array {
        $config = $subscription->{WebhookSubscriptionInterface::ATTR_DESTINATION_CONFIG} ?? [];
        $url    = \is_array($config) ? ($config['url'] ?? null) : null;

        if (! \is_string($url) || $url === '') {
            return [
                'ok'               => false,
                'http_status'      => null,
                'response_headers' => null,
                'response_body'    => null,
                'latency_ms'       => 0,
                'error'            => 'destination_config.url is missing',
            ];
        }

        $method    = \is_array($config) ? \strtoupper((string) ($config['method'] ?? 'POST')) : 'POST';
        $timeout   = (int) \config('webhook.http.timeout_seconds', 30);
        $userAgent = (string) \config('webhook.http.user_agent', 'Academorix-Webhook/1.0');
        $maxBody   = (int) \config('webhook.http.max_response_body_bytes', 65536);

        $payload   = $delivery->{WebhookDeliveryInterface::ATTR_PAYLOAD} ?? [];
        $payloadJson = \json_encode($payload, \JSON_UNESCAPED_UNICODE | \JSON_UNESCAPED_SLASHES);
        if ($payloadJson === false) {
            $payloadJson = '{}';
        }

        $timestamp = \time();
        $eventName = (string) $delivery->{WebhookDeliveryInterface::ATTR_EVENT_NAME};

        $secret = (string) $subscription->{WebhookSubscriptionInterface::ATTR_SIGNING_SECRET};
        $signature = $this->signer->sign($payloadJson, $secret, $timestamp, $eventName);

        $headers = [
            'Content-Type'            => 'application/json',
            'User-Agent'              => $userAgent,
            'X-Webhook-ID'            => (string) $delivery->getKey(),
            'X-Webhook-Event'         => $eventName,
            'X-Webhook-Event-Version' => (string) ($delivery->{WebhookDeliveryInterface::ATTR_API_VERSION} ?? 'v1'),
            'X-Webhook-Timestamp'     => (string) $timestamp,
            'X-Webhook-Signature'     => $signature,
            'X-Webhook-Attempt'       => (string) $delivery->{WebhookDeliveryInterface::ATTR_ATTEMPT},
        ];

        // Rotation grace — attach the previous-secret signature so
        // receivers can migrate over the grace window without downtime.
        if ($subscription->hasRotationGrace()) {
            $previousSecret = (string) ($subscription->{WebhookSubscriptionInterface::ATTR_SIGNING_SECRET_PREVIOUS} ?? '');
            if ($previousSecret !== '') {
                $headers['X-Webhook-Signature-Previous'] = $this->signer->sign(
                    $payloadJson,
                    $previousSecret,
                    $timestamp,
                    $eventName,
                );
            }
        }

        $startedAt = (int) (\microtime(true) * 1000);

        try {
            $response = $this->http
                ->withHeaders($headers)
                ->timeout($timeout)
                ->withBody($payloadJson, 'application/json')
                ->send($method, $url);
        } catch (ConnectionException $e) {
            return [
                'ok'               => false,
                'http_status'      => null,
                'response_headers' => null,
                'response_body'    => null,
                'latency_ms'       => (int) (\microtime(true) * 1000) - $startedAt,
                'error'            => 'connection: ' . $e->getMessage(),
            ];
        } catch (\Throwable $e) {
            return [
                'ok'               => false,
                'http_status'      => null,
                'response_headers' => null,
                'response_body'    => null,
                'latency_ms'       => (int) (\microtime(true) * 1000) - $startedAt,
                'error'            => \get_class($e) . ': ' . $e->getMessage(),
            ];
        }

        $status  = $response->status();
        $body    = \substr($response->body(), 0, $maxBody);
        $latency = (int) (\microtime(true) * 1000) - $startedAt;

        return [
            'ok'               => $response->successful(),
            'http_status'      => $status,
            'response_headers' => $response->headers(),
            'response_body'    => $body,
            'latency_ms'       => $latency,
            'error'            => $response->successful() ? null : \sprintf('http_%d', $status),
        ];
    }
}
