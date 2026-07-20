<?php

declare(strict_types=1);

namespace Academorix\Notifications\Mail\Services;

use Academorix\Notifications\Mail\Contracts\Services\MailProviderWebhookVerifierInterface;
use Illuminate\Container\Attributes\Log;
use Illuminate\Container\Attributes\Singleton;
use Illuminate\Http\Request;
use Psr\Log\LoggerInterface;

/**
 * Default {@see MailProviderWebhookVerifierInterface} implementation.
 *
 * Reads the provider's signing secret from
 * `config('notifications-mail.webhook_secrets.<provider>')` (with a
 * `<provider>_previous` sibling for graceful key rotation) and runs
 * the provider-specific verification algorithm. Every branch fails
 * closed — a missing secret returns `false` (not `true`).
 *
 * Provider algorithms:
 *
 *   * `mailgun`  — HMAC-SHA256 over `timestamp + token` in the body,
 *                  compared against `signature` field.
 *   * `sendgrid` — Ed25519 over `timestamp + raw body`, key material
 *                  in PEM.
 *   * `aws-ses`  — SNS envelope signature verified against x509 cert
 *                  advertised by `SigningCertURL`. (This
 *                  implementation only verifies the presence of the
 *                  `TopicArn` matches; full x509 verification lands
 *                  when the AWS SDK is available.)
 *   * `postmark` — HTTP Basic auth compared constant-time against
 *                  the configured secret.
 *   * `resend`   — Svix `svix-signature` header check.
 *
 * `#[Singleton]` — stateless; the injected logger is the only
 * dependency and it is itself framework-scoped. Octane-safe.
 *
 * @category NotificationsMail
 *
 * @since    0.1.0
 */
#[Singleton]
final class MailProviderWebhookVerifier implements MailProviderWebhookVerifierInterface
{
    /**
     * @param  LoggerInterface  $log  Structured logger.
     */
    public function __construct(
        #[Log] private readonly LoggerInterface $log,
    ) {
    }

    /**
     * {@inheritDoc}
     */
    public function verify(string $provider, Request $request): bool
    {
        $primary = $this->secret($provider);
        $previous = $this->secret($provider . '_previous');

        // Fail-closed: no configured secret → reject. Never
        // silently accept unsigned requests.
        if ($primary === null && $previous === null) {
            $this->log->warning('notifications-mail: no webhook secret configured', [
                'provider' => $provider,
            ]);

            return false;
        }

        foreach (\array_filter([$primary, $previous]) as $secret) {
            if ($this->verifyWith($provider, $request, $secret)) {
                return true;
            }
        }

        return false;
    }

    /**
     * Run the provider-specific verification against one candidate
     * secret. Returns `true` on a match.
     */
    private function verifyWith(string $provider, Request $request, string $secret): bool
    {
        return match ($provider) {
            'mailgun'  => $this->verifyMailgun($request, $secret),
            'sendgrid' => $this->verifySendgrid($request, $secret),
            'aws-ses'  => $this->verifySes($request, $secret),
            'postmark' => $this->verifyPostmark($request, $secret),
            'resend'   => $this->verifyResend($request, $secret),
            default    => $this->logUnknown($provider),
        };
    }

    /**
     * Mailgun — HMAC-SHA256 over `timestamp + token`.
     */
    private function verifyMailgun(Request $request, string $secret): bool
    {
        $timestamp = (string) ($request->input('signature.timestamp') ?? $request->input('timestamp'));
        $token     = (string) ($request->input('signature.token') ?? $request->input('token'));
        $signature = (string) ($request->input('signature.signature') ?? $request->input('signature'));

        if ($timestamp === '' || $token === '' || $signature === '') {
            return false;
        }

        $expected = \hash_hmac('sha256', $timestamp . $token, $secret);

        return \hash_equals($expected, $signature);
    }

    /**
     * SendGrid — Ed25519 signature on raw body + timestamp header.
     * Falls back to `false` when sodium isn't available.
     */
    private function verifySendgrid(Request $request, string $secret): bool
    {
        if (! \function_exists('sodium_crypto_sign_verify_detached')) {
            return false;
        }

        $signature = (string) $request->header('X-Twilio-Email-Event-Webhook-Signature');
        $timestamp = (string) $request->header('X-Twilio-Email-Event-Webhook-Timestamp');

        if ($signature === '' || $timestamp === '') {
            return false;
        }

        $decodedSig = \base64_decode($signature, true);
        $decodedKey = \base64_decode($this->stripPemHeaders($secret), true);

        if ($decodedSig === false || $decodedKey === false) {
            return false;
        }

        $payload = $timestamp . $request->getContent();

        try {
            return \sodium_crypto_sign_verify_detached($decodedSig, $payload, $decodedKey);
        } catch (\Throwable $e) {
            $this->log->warning('notifications-mail: sendgrid sodium verify threw', [
                'error' => $e->getMessage(),
            ]);

            return false;
        }
    }

    /**
     * SES via SNS — this implementation verifies the envelope's
     * TopicArn matches the configured secret (SNS topic ARN). Full
     * x509 verification requires `aws/aws-sdk-php` and is added
     * when the SDK is available.
     */
    private function verifySes(Request $request, string $secret): bool
    {
        $topicArn = (string) ($request->json('TopicArn') ?? '');

        if ($topicArn === '') {
            return false;
        }

        return \hash_equals($secret, $topicArn);
    }

    /**
     * Postmark — HTTP Basic auth header compared constant-time.
     */
    private function verifyPostmark(Request $request, string $secret): bool
    {
        $auth = (string) $request->header('Authorization');

        if ($auth === '' || ! \str_starts_with($auth, 'Basic ')) {
            return false;
        }

        return \hash_equals($secret, \substr($auth, 6));
    }

    /**
     * Resend — Svix `svix-signature` header check. The header shape
     * is `v1,base64(hmac(timestamp.payload))`; we verify the HMAC
     * of the configured secret against the body.
     */
    private function verifyResend(Request $request, string $secret): bool
    {
        $signatureHeader = (string) $request->header('svix-signature');
        $timestamp       = (string) $request->header('svix-timestamp');
        $messageId       = (string) $request->header('svix-id');

        if ($signatureHeader === '' || $timestamp === '' || $messageId === '') {
            return false;
        }

        $signed = $messageId . '.' . $timestamp . '.' . $request->getContent();
        $secretBytes = \base64_decode(\str_replace('whsec_', '', $secret), true);

        if ($secretBytes === false) {
            return false;
        }

        $expected = 'v1,' . \base64_encode(\hash_hmac('sha256', $signed, $secretBytes, true));

        foreach (\explode(' ', $signatureHeader) as $candidate) {
            if (\hash_equals($expected, $candidate)) {
                return true;
            }
        }

        return false;
    }

    /**
     * Resolve a configured secret. Empty strings collapse to null
     * so `array_filter` skips them.
     */
    private function secret(string $key): ?string
    {
        $value = \config(\sprintf('notifications-mail.webhook_secrets.%s', $key));

        if (! \is_string($value) || $value === '') {
            return null;
        }

        return $value;
    }

    /**
     * Strip PEM header / footer lines from a base64-encoded key
     * material blob.
     */
    private function stripPemHeaders(string $key): string
    {
        return \trim((string) \preg_replace('/-----(BEGIN|END)[^-]+-----/', '', $key));
    }

    /**
     * Log an unknown provider slug and return false.
     */
    private function logUnknown(string $provider): bool
    {
        $this->log->warning('notifications-mail: unknown webhook provider', [
            'provider' => $provider,
        ]);

        return false;
    }
}
