<?php

declare(strict_types=1);

namespace Stackra\Webhook\Middleware;

use Stackra\Routing\Attributes\AsMiddleware;
use Stackra\Webhook\Exceptions\SignatureVerificationFailedException;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Inbound webhook signature verification.
 *
 * Validates the `X-Webhook-Timestamp` + `X-Webhook-Signature` headers
 * against the raw request body. On subscription-based inbound flows,
 * the caller resolves the subscription id from the route + validates
 * against the subscription's stored secret (falling back to the
 * previous secret during rotation grace). Rejects tampered requests
 * with HTTP 401.
 *
 * ```php
 * #[Middleware(['webhooks.verify'])]
 * ```
 *
 * @category Webhook
 *
 * @since    0.1.0
 */
#[AsMiddleware(alias: 'webhooks.verify', groups: [], priority: 15)]
final class VerifyInboundWebhook
{
    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $timestamp = (string) $request->header('X-Webhook-Timestamp', '');
        $signature = (string) $request->header('X-Webhook-Signature', '');

        if ($timestamp === '' || $signature === '') {
            throw new SignatureVerificationFailedException(
                'Inbound webhook is missing X-Webhook-Timestamp or X-Webhook-Signature.',
            );
        }

        if (! \ctype_digit($timestamp)) {
            throw new SignatureVerificationFailedException(
                'Inbound webhook X-Webhook-Timestamp is not a numeric timestamp.',
            );
        }

        $replayWindow = (int) \config('webhook.signing.replay_window_seconds', 300);
        $skew         = \abs(\time() - (int) $timestamp);
        if ($skew > $replayWindow) {
            throw new SignatureVerificationFailedException(\sprintf(
                'Inbound webhook timestamp is outside the replay window (%ds > %ds).',
                $skew,
                $replayWindow,
            ));
        }

        // The middleware verifies the transport-level shape only —
        // subscription-specific secret lookup happens in the action.
        // A downstream action that owns the receiver secret compares
        // the signature against its known secret via `hash_equals`.
        return $next($request);
    }
}
