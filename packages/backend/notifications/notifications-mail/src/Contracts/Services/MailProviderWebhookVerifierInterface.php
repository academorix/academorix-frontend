<?php

declare(strict_types=1);

namespace Stackra\Notifications\Mail\Contracts\Services;

use Stackra\Notifications\Mail\Services\MailProviderWebhookVerifier;
use Illuminate\Container\Attributes\Bind;
use Illuminate\Http\Request;

/**
 * Per-provider signature verification.
 *
 * Every mail provider signs webhook callbacks differently — Mailgun
 * uses HMAC-SHA256 on `(timestamp, token)` body params; SendGrid
 * uses Ed25519 on the raw body via the `X-Twilio-Email-Event-Webhook-Signature`
 * header; AWS SES arrives via SNS with an x509 certificate;
 * Postmark uses a basic auth header pair; Resend uses Svix
 * (`svix-signature`).
 *
 * Implementations look up the configured secret for the given
 * provider under
 * `config('notifications-mail.webhook_secrets.{provider}')` and
 * apply the provider-specific verification algorithm. A failed
 * verification MUST return `false` — the caller
 * ({@see \Stackra\Notifications\Mail\Middleware\VerifyMailWebhookMiddleware})
 * then raises the correct HTTP 401 with error code
 * `NOTIFICATIONS_MAIL_WEBHOOK_SIGNATURE_INVALID`.
 *
 * @category NotificationsMail
 *
 * @since    0.1.0
 */
#[Bind(MailProviderWebhookVerifier::class)]
interface MailProviderWebhookVerifierInterface
{
    /**
     * Verify the inbound webhook signature.
     *
     * @param  string   $provider  Provider slug (`mailgun`,
     *                             `sendgrid`, `aws-ses`, `postmark`,
     *                             `resend`).
     * @param  Request  $request   The inbound HTTP request.
     * @return bool  `true` when the signature is valid, `false`
     *               otherwise. Also returns `false` when no signing
     *               secret is configured for the provider (a
     *               deliberate fail-closed default).
     */
    public function verify(string $provider, Request $request): bool;
}
