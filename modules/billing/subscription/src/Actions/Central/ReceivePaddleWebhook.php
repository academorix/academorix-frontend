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
 * `POST /webhooks/inbound/subscription/paddle` — inbound Paddle
 * webhook receiver.
 *
 * Same shape as {@see ReceiveStripeWebhook} — payload event id +
 * queue dispatch + 202.
 *
 * @category Subscription
 *
 * @since    0.1.0
 */
#[AsAction(name: 'subscription.central.webhook.paddle')]
#[Post('/webhooks/inbound/subscription/paddle')]
#[Middleware(['api', 'webhooks.verify'])]
final class ReceivePaddleWebhook
{
    use AsController;

    public function __invoke(Request $request): JsonResponse
    {
        /** @var array<string, mixed> $payload */
        $payload = $request->json()->all();

        $eventId = (string) ($payload['event_id'] ?? $payload['id'] ?? '');
        if ($eventId === '') {
            return response()->json(['status' => 'ignored'], JsonResponse::HTTP_ACCEPTED);
        }

        SyncFromCashierWebhookJob::dispatch($eventId, 'paddle', $payload);

        return response()->json(['status' => 'accepted'], JsonResponse::HTTP_ACCEPTED);
    }
}
