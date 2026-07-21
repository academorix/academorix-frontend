<?php

declare(strict_types=1);

namespace Stackra\Notifications\Mail\Actions\Central;

use Stackra\Notifications\Mail\Jobs\IngestMailProviderWebhookJob;
use Stackra\Routing\Attributes\AsAction;
use Stackra\Routing\Attributes\Middleware;
use Stackra\Routing\Attributes\Post;
use Stackra\Routing\Concerns\AsController;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * `POST /webhooks/notifications/mail/{provider}` — public provider
 * webhook receiver.
 *
 * The signature IS the credential — the `verify.mail-webhook`
 * middleware verifies it before the action runs. A failed signature
 * raises {@see \Stackra\Notifications\Mail\Exceptions\MailWebhookSignatureFailedException}
 * (HTTP 401) upstream; a request that reaches `__invoke()` here is
 * already trusted.
 *
 * Never authenticates — no `auth:sanctum`, no `tenant.resolve`. The
 * middleware stack is deliberately minimal: `api` for the JSON
 * response body + `verify.mail-webhook` for the credential check.
 *
 * The action does NOT parse the payload — that lives in
 * {@see IngestMailProviderWebhookJob} so this endpoint returns
 * `202 Accepted` in constant time regardless of payload complexity.
 * Providers with tight webhook timeout budgets (Mailgun, Postmark)
 * see fast acks and don't retry as aggressively.
 *
 * Blueprint reference:
 *   modules/notifications/blueprints/notifications-mail/module.json §hosts.central
 *
 * @category NotificationsMail
 *
 * @since    0.1.0
 */
#[AsAction(name: 'notifications.mail.webhook.receive')]
#[Post('/webhooks/notifications/mail/{provider}')]
#[Middleware(['api', 'verify.mail-webhook'])]
final class ReceiveMailWebhook
{
    use AsController;

    /**
     * @param  Request  $request   Inbound HTTP request.
     * @param  string   $provider  Provider slug (`mailgun`, `sendgrid`, ...).
     */
    public function __invoke(Request $request, string $provider): JsonResponse
    {
        /** @var array<string, mixed> $payload */
        $payload = $request->json()->all();

        // Sanitise headers — never echo an Authorization back into
        // the ingest job payload.
        $headers = \array_filter(
            $request->headers->all(),
            static fn (string $name): bool => \strtolower($name) !== 'authorization',
            ARRAY_FILTER_USE_KEY,
        );

        IngestMailProviderWebhookJob::dispatch($provider, $payload, $headers);

        return response()->json(['status' => 'accepted'], JsonResponse::HTTP_ACCEPTED);
    }
}
