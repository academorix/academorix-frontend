<?php

declare(strict_types=1);

namespace Academorix\Webhook\Actions\Central;

use Academorix\Routing\Attributes\AsAction;
use Academorix\Routing\Attributes\Middleware;
use Academorix\Routing\Attributes\Post;
use Academorix\Routing\Concerns\AsController;
use Academorix\Webhook\Events\InboundWebhookReceived;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * `POST /webhooks/inbound/{namespace}/{provider}` — public receiver
 * for third-party webhooks (Stripe, Paddle, GitHub, …).
 *
 * The signature IS the credential — the `webhooks.verify` middleware
 * validates the shape of `X-Webhook-*` headers; the provider-specific
 * secret check lives in the event listener registered per namespace.
 * A signature failure raises {@see \Academorix\Webhook\Exceptions\SignatureVerificationFailedException}
 * (HTTP 401) before this action runs.
 *
 * @category Webhook
 *
 * @since    0.1.0
 */
#[AsAction(name: 'webhook.central.inbound.receive')]
#[Post('/webhooks/inbound/{namespace}/{provider}')]
#[Middleware(['api', 'webhooks.verify'])]
final class ReceiveInboundWebhook
{
    use AsController;

    public function __invoke(Request $request, string $namespace, string $provider): JsonResponse
    {
        /** @var array<string, mixed> $payload */
        $payload = $request->json()->all();

        // Sanitise headers — never echo an Authorization back.
        $headers = \array_filter(
            $request->headers->all(),
            static fn (string $name): bool => \strtolower($name) !== 'authorization',
            ARRAY_FILTER_USE_KEY,
        );

        InboundWebhookReceived::dispatch($namespace, $provider, $payload, $headers);

        return response()->json(['status' => 'accepted'], JsonResponse::HTTP_ACCEPTED);
    }
}
