<?php

declare(strict_types=1);

namespace Academorix\Notifications\Mail\Middleware;

use Academorix\Notifications\Mail\Contracts\Services\MailProviderWebhookVerifierInterface;
use Academorix\Notifications\Mail\Exceptions\MailWebhookSignatureFailedException;
use Academorix\Routing\Attributes\AsMiddleware;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Psr\Log\LoggerInterface;

/**
 * Verify the inbound provider webhook signature before the receiver
 * action runs.
 *
 * The middleware resolves the provider slug from the `{provider}`
 * route parameter, delegates verification to
 * {@see MailProviderWebhookVerifierInterface} (which knows the
 * per-provider algorithm — Mailgun HMAC / SendGrid Ed25519 / SES
 * SNS x509 / Postmark basic auth / Resend Svix), and raises
 * {@see MailWebhookSignatureFailedException} on failure.
 *
 * `alias: 'verify.mail-webhook'` — attached to the central-plane
 * receiver route via `#[Middleware(['verify.mail-webhook'])]`.
 *
 * Blueprint reference:
 *   modules/notifications/blueprints/notifications-mail/middleware.json
 *
 * @category NotificationsMail
 *
 * @since    0.1.0
 */
#[AsMiddleware(alias: 'verify.mail-webhook', priority: 60)]
final class VerifyMailWebhookMiddleware
{
    /**
     * @param  MailProviderWebhookVerifierInterface  $verifier  Per-provider signature verifier.
     * @param  LoggerInterface                       $log       Structured logger.
     */
    public function __construct(
        private readonly MailProviderWebhookVerifierInterface $verifier,
        private readonly LoggerInterface $log,
    ) {
    }

    /**
     * Handle the request.
     *
     * @param  Request  $request  Inbound HTTP request.
     * @param  Closure  $next     Downstream pipeline.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $provider = (string) $request->route('provider');

        if ($provider === '') {
            $this->log->warning('notifications-mail: provider route parameter missing on webhook');

            throw new MailWebhookSignatureFailedException(
                'Provider route parameter is required on the mail webhook receiver.',
            );
        }

        if (! $this->verifier->verify($provider, $request)) {
            $this->log->warning('notifications-mail: webhook signature verification failed', [
                'provider' => $provider,
                'path'     => $request->path(),
            ]);

            throw new MailWebhookSignatureFailedException(
                \sprintf('Signature verification failed for provider "%s".', $provider),
            );
        }

        return $next($request);
    }
}
