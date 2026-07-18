<?php

declare(strict_types=1);

namespace Academorix\Subscription\Actions\Central;

use Academorix\Routing\Attributes\AsAction;
use Academorix\Routing\Attributes\Middleware;
use Academorix\Routing\Attributes\Post;
use Academorix\Routing\Concerns\AsController;
use Academorix\Subscription\Jobs\SyncFromCashierWebhookJob;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * `POST /webhooks/inbound/subscription/stripe` — inbound Stripe
 * webhook receiver.
 *
 * Signature verification is delegated to the shared
 * `webhooks.verify` middleware. This action's job is to dispatch a
 * queue job that translates the payload into our own state and to
 * ACK the provider quickly with HTTP 202.
 *
 * @category Subscription
 *
 * @since    0.1.0
 */
#[AsAction(name: 'subscription.central.webhook.stripe')]
#[Post('/webhooks/inbound/subscription/stripe')]
#[Middleware(['api', 'webhooks.verify'])]
final class ReceiveStripeWebhook
{
    use AsController;

    public function __invoke(Request $request): JsonResponse
    {
        /** @var array<string, mixed> $payload */
        $payload = $request->json()->all();

        $eventId = (string) ($payload['id'] ?? '');
        if ($eventId === '') {
            // Stripe events always carry `id`. Missing means malformed;
            // still return 202 so the provider stops retrying an
            // unrecoverable request.
            return response()->json(['status' => 'ignored'], JsonResponse::HTTP_ACCEPTED);
        }

        SyncFromCashierWebhookJob::dispatch($eventId, 'stripe', $payload);

        return response()->json(['status' => 'accepted'], JsonResponse::HTTP_ACCEPTED);
    }
}
